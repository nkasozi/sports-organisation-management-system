import type { Option } from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";

import type { PublicTableFetchCommand } from "./convexPublicDataTableFetch";
import { fetch_and_store_public_table } from "./convexPublicDataTableFetch";
import {
  get_tables_for_organization_scope,
  type PublicDataPageType,
} from "./convexPublicDataTables";
import { get_sync_manager, type TableName } from "./convexSyncService";

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

interface PublicTablesFetchSummary {
  tables_fetched: number;
  total_records: number;
  failed_tables: string[];
}

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

function record_table_outcome(
  summary: PublicTablesFetchSummary,
  table_name: TableName,
  outcome: Result<number>,
): PublicTablesFetchSummary {
  if (outcome.success)
    return {
      ...summary,
      tables_fetched: summary.tables_fetched + 1,
      total_records: summary.total_records + outcome.data,
    };
  console.warn("[PublicData] Failed to fetch table", {
    event: "public_data_fetch_table_failed",
    table_name,
    error: outcome.error,
  });
  return { ...summary, failed_tables: [...summary.failed_tables, table_name] };
}

function build_unfetched_result(error: string): PublicDataFetchResult {
  return { success: false, tables_fetched: 0, total_records: 0, error };
}

async function fetch_public_tables(
  command: PublicTableFetchCommand,
  tables: TableName[],
): Promise<PublicTablesFetchSummary> {
  let summary: PublicTablesFetchSummary = {
    tables_fetched: 0,
    total_records: 0,
    failed_tables: [],
  };
  for (const table_name of tables)
    summary = record_table_outcome(
      summary,
      table_name,
      await fetch_and_store_public_table(command, table_name),
    );
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
  organization_scope: Option<string>,
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

  const tables = get_tables_for_organization_scope(
    page_type,
    organization_scope,
  );

  console.log("[PublicData] Fetching public tables", {
    event: PUBLIC_DATA_EVENT.FETCH_STARTED,
    page_type,
    table_count: tables.length,
  });

  const summary = await fetch_public_tables(
    { convex_query: convex_client_result.data.query, organization_scope },
    tables,
  );
  return build_fetch_result(summary, tables.length);
}
