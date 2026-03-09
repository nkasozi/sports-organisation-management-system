import { get_database } from "$lib/adapters/repositories/database";
import {
  get_sync_manager,
  TABLE_NAMES,
  type TableName,
} from "./convexSyncService";
import { set_pulling_from_remote } from "./syncState";

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

function convert_convex_record_to_local(
  remote_record: ConvexRecord,
): Record<string, unknown> {
  const local_data = { ...remote_record } as Record<string, unknown>;
  delete local_data._id;
  delete local_data.local_id;
  delete local_data.synced_at;
  delete local_data.version;
  local_data.id = remote_record.local_id;
  return local_data;
}

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
  const table = database.table(table_name);

  set_pulling_from_remote(true);

  try {
    const local_records = remote_records.map(convert_convex_record_to_local);
    await table.bulkPut(local_records);
  } finally {
    set_pulling_from_remote(false);
  }

  return remote_records.length;
}

function is_convex_client_available(): boolean {
  const manager = get_sync_manager();
  const convex_client = manager.get_convex_client();
  return convex_client !== null;
}

async function try_seed_all_tables_from_convex(
  on_progress: ProgressCallback,
): Promise<ConvexSeedResult> {
  const manager = get_sync_manager();
  const convex_client = manager.get_convex_client();

  if (!convex_client) {
    console.warn("[ConvexSeeding] Convex client not available");
    return {
      success: false,
      data_source: "none",
      tables_fetched: 0,
      total_records: 0,
      failed_tables: [],
    };
  }

  let tables_fetched = 0;
  let total_records = 0;
  const failed_tables: string[] = [];
  const total_tables = TABLE_NAMES.length;

  console.log(
    `[ConvexSeeding] Attempting to seed ${total_tables} tables from Convex...`,
  );

  for (const table_name of TABLE_NAMES) {
    const progress_percent =
      20 + Math.round((tables_fetched / total_tables) * 60);
    on_progress(`Pulling ${table_name} from server...`, progress_percent);

    try {
      const records_count = await fetch_and_store_single_table(
        convex_client.query,
        table_name,
      );
      total_records += records_count;
      tables_fetched++;
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[ConvexSeeding] Failed to fetch ${table_name}: ${error_message}`,
      );
      failed_tables.push(table_name);
    }
  }

  const enough_tables_succeeded =
    failed_tables.length <= Math.floor(total_tables * 0.2);
  const has_meaningful_data = total_records > 0;
  const is_successful = enough_tables_succeeded && has_meaningful_data;

  console.log(
    `[ConvexSeeding] Result: ${tables_fetched}/${total_tables} tables, ${total_records} records` +
      (failed_tables.length > 0
        ? ` (failed: ${failed_tables.join(", ")})`
        : ""),
  );

  return {
    success: is_successful,
    data_source: is_successful ? "convex" : "none",
    tables_fetched,
    total_records,
    failed_tables,
  };
}

export {
  type ConvexSeedResult,
  type DataSource,
  type ProgressCallback,
  is_convex_client_available,
  try_seed_all_tables_from_convex,
};
