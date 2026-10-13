import { get_database } from "$lib/adapters/repositories/database";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  get_sync_manager,
  TABLE_NAMES,
  type TableName,
} from "./convexSyncService";
import {
  apply_remote_snapshot_records,
  SnapshotRecordScope,
} from "./syncRemoteApplyRecords";

type DataSource = "convex" | "local" | "none";

interface ConvexSeedResult {
  success: boolean;
  data_source: DataSource;
  tables_fetched: number;
  total_records: number;
  failed_tables: string[];
}

interface ConvexRecord {
  _id: string;
  local_id: string;
  synced_at: string;
  version: number;
  [key: string]: unknown;
}

type ProgressCallback = (message: string, percentage: number) => void;

async function fetch_and_store_single_table(
  convex_query: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>,
  table_name: TableName,
): Promise<number> {
  const remote_records = (await convex_query("sync:get_all_records", {
    table_name,
  })) as ConvexRecord[];

  if (!remote_records || remote_records.length === 0) {
    return 0;
  }

  const database = get_database();

  await apply_remote_snapshot_records(
    { database, gate: sync_change_tracking_gate },
    table_name,
    remote_records,
    SnapshotRecordScope.PUBLIC_PROJECTION,
  );

  return remote_records.length;
}

function is_convex_client_available(): boolean {
  const manager = get_sync_manager();
  return manager.get_convex_client().success;
}

const SEEDING_PROGRESS_START_PERCENT = 20;
const SEEDING_PROGRESS_SPAN_PERCENT = 60;
const MAX_FAILED_TABLE_RATIO = 0.2;

type ConvexQuery = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

interface SeedTablesSummary {
  tables_fetched: number;
  total_records: number;
  failed_tables: string[];
}

function build_unavailable_seed_result(): ConvexSeedResult {
  return {
    success: false,
    data_source: "none",
    tables_fetched: 0,
    total_records: 0,
    failed_tables: [],
  };
}

async function seed_tables_sequentially(
  convex_query: ConvexQuery,
  on_progress: ProgressCallback,
): Promise<SeedTablesSummary> {
  const summary: SeedTablesSummary = {
    tables_fetched: 0,
    total_records: 0,
    failed_tables: [],
  };
  const total_tables = TABLE_NAMES.length;

  for (const table_name of TABLE_NAMES) {
    const progress_percent =
      SEEDING_PROGRESS_START_PERCENT +
      Math.round(
        (summary.tables_fetched / total_tables) * SEEDING_PROGRESS_SPAN_PERCENT,
      );
    on_progress(`Pulling ${table_name} from server...`, progress_percent);

    try {
      const records_count = await fetch_and_store_single_table(
        convex_query,
        table_name,
      );
      summary.total_records += records_count;
      summary.tables_fetched++;
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.warn("[ConvexSeeding] Failed to fetch table", {
        event: "convex_seeding_fetch_table_failed",
        table_name,
        error: String(error_message),
      });
      summary.failed_tables.push(table_name);
    }
  }

  return summary;
}

function build_seed_result(summary: SeedTablesSummary): ConvexSeedResult {
  const { tables_fetched, total_records, failed_tables } = summary;
  const total_tables = TABLE_NAMES.length;
  const enough_tables_succeeded =
    failed_tables.length <= Math.floor(total_tables * MAX_FAILED_TABLE_RATIO);
  const has_meaningful_data = total_records > 0;
  const is_successful = enough_tables_succeeded && has_meaningful_data;

  console.log("[ConvexSeeding] Seed result", {
    event: "convex_seed_result",
    tables_fetched,
    total_tables,
    total_records,
    failed_tables,
  });

  return {
    success: is_successful,
    data_source: is_successful ? "convex" : "none",
    tables_fetched,
    total_records,
    failed_tables,
  };
}

async function try_seed_all_tables_from_convex(
  on_progress: ProgressCallback,
): Promise<ConvexSeedResult> {
  const convex_client_result = get_sync_manager().get_convex_client();

  if (!convex_client_result.success) {
    console.warn("[ConvexSeeding] Convex client not available", {
      event: "convex_seed_client_unavailable",
    });
    return build_unavailable_seed_result();
  }

  console.log("[ConvexSeeding] Seeding tables from Convex", {
    event: "convex_seed_started",
    table_count: TABLE_NAMES.length,
  });

  const summary = await seed_tables_sequentially(
    convex_client_result.data.query,
    on_progress,
  );
  return build_seed_result(summary);
}

export {
  type DataSource,
  is_convex_client_available,
  type ProgressCallback,
  try_seed_all_tables_from_convex,
};
