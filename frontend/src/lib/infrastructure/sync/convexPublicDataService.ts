import { get_database } from "$lib/adapters/repositories/database";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  get_tables_for_page,
  type PublicDataPageType,
} from "./convexPublicDataTables";
import { get_sync_manager, type TableName } from "./convexSyncService";
import {
  apply_remote_snapshot_records,
  SnapshotCursorPolicy,
} from "./syncRemoteApplyRecords";

interface ConvexRecord {
  _id: string;
  local_id: string;
  synced_at: string;
  version: number;
  [key: string]: unknown;
}

type PublicDataFetchResult =
  | {
      success: true;
      tables_fetched: number;
      total_records: number;
    }
  | {
      success: false;
      tables_fetched: number;
      total_records: number;
      error: string;
    };

type ConvexQuery = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

interface PublicTablesFetchSummary {
  tables_fetched: number;
  total_records: number;
  failed_tables: string[];
}

const TABLE_FETCH_TIMEOUT_MS = 8000;
const GET_ALL_RECORDS_QUERY_NAME = "sync:get_all_records";
const OFFLINE_ERROR = "offline";
const CONVEX_NOT_AVAILABLE_ERROR = "convex_not_available";
const UNDEFINED_TYPE_NAME = "undefined";
const FAILED_TABLES_ERROR_PREFIX = "Failed tables: ";
const TABLE_LIST_SEPARATOR = ", ";

const PUBLIC_DATA_EVENT = {
  FETCH_COMPLETED: "public_data_fetch_completed",
  FETCH_SKIPPED_OFFLINE: "public_data_fetch_skipped_offline",
  FETCH_SKIPPED_NO_CLIENT: "public_data_fetch_skipped_no_client",
  FETCH_STARTED: "public_data_fetch_started",
} as const;

async function fetch_and_store_table(
  convex_query: ConvexQuery,
  table_name: TableName,
): Promise<number> {
  const query_promise = convex_query(GET_ALL_RECORDS_QUERY_NAME, {
    table_name,
  });
  const timeout_promise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`fetch_timed_out: ${table_name}`)),
      TABLE_FETCH_TIMEOUT_MS,
    ),
  );
  const remote_records = (await Promise.race([
    query_promise,
    timeout_promise,
  ])) as ConvexRecord[];
  if (!remote_records || remote_records.length === 0) {
    return 0;
  }
  const database = get_database();
  await apply_remote_snapshot_records(
    { database, gate: sync_change_tracking_gate },
    table_name,
    remote_records,
    SnapshotCursorPolicy.KEEP_CURSOR,
  );

  return remote_records.length;
}

function build_unfetched_result(error: string): PublicDataFetchResult {
  return { success: false, tables_fetched: 0, total_records: 0, error };
}

async function fetch_public_tables(
  convex_query: ConvexQuery,
  tables: TableName[],
): Promise<PublicTablesFetchSummary> {
  const summary: PublicTablesFetchSummary = {
    tables_fetched: 0,
    total_records: 0,
    failed_tables: [],
  };

  for (const table_name of tables) {
    try {
      const records_count = await fetch_and_store_table(
        convex_query,
        table_name,
      );
      summary.total_records += records_count;
      summary.tables_fetched++;
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.warn("[PublicData] Failed to fetch table", {
        event: "public_data_fetch_table_failed",
        table_name,
        error: String(error_message),
      });
      summary.failed_tables.push(table_name);
    }
  }

  return summary;
}

function build_fetch_result(
  summary: PublicTablesFetchSummary,
  table_count: number,
): PublicDataFetchResult {
  const { tables_fetched, total_records, failed_tables } = summary;

  console.log("[PublicData] Fetch complete", {
    event: PUBLIC_DATA_EVENT.FETCH_COMPLETED,
    tables_fetched,
    table_count,
    total_records,
    failed_tables,
  });

  if (failed_tables.length === 0) {
    return { success: true, tables_fetched, total_records };
  }

  return {
    success: false,
    tables_fetched,
    total_records,
    error: `${FAILED_TABLES_ERROR_PREFIX}${failed_tables.join(TABLE_LIST_SEPARATOR)}`,
  };
}

export async function fetch_public_data_from_convex(
  page_type: PublicDataPageType,
): Promise<PublicDataFetchResult> {
  if (typeof navigator !== UNDEFINED_TYPE_NAME && !navigator.onLine) {
    console.warn("[PublicData] Device is offline, skipping Convex fetch", {
      event: PUBLIC_DATA_EVENT.FETCH_SKIPPED_OFFLINE,
      page_type,
    });
    return build_unfetched_result(OFFLINE_ERROR);
  }

  const convex_client_result = get_sync_manager().get_convex_client();

  if (!convex_client_result.success) {
    console.warn("[PublicData] Convex client not available", {
      event: PUBLIC_DATA_EVENT.FETCH_SKIPPED_NO_CLIENT,
      page_type,
    });
    return build_unfetched_result(CONVEX_NOT_AVAILABLE_ERROR);
  }

  const tables = get_tables_for_page(page_type);

  console.log("[PublicData] Fetching public tables", {
    event: PUBLIC_DATA_EVENT.FETCH_STARTED,
    page_type,
    table_count: tables.length,
  });

  const summary = await fetch_public_tables(
    convex_client_result.data.query,
    tables,
  );
  return build_fetch_result(summary, tables.length);
}
