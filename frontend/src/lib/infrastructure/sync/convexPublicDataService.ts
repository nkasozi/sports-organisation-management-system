import { get_database } from "$lib/adapters/repositories/database";
import { get_sync_manager, type TableName } from "./convexSyncService";
import { set_pulling_from_remote } from "./syncState";

interface ConvexRecord {
  _id: string;
  local_id: string;
  synced_at: string;
  version: number;
  [key: string]: unknown;
}

interface PublicDataFetchResult {
  success: boolean;
  tables_fetched: number;
  total_records: number;
  error: string | null;
}

const COMPETITION_RESULTS_TABLES: TableName[] = [
  "organizations",
  "competitions",
  "competition_formats",
  "competition_teams",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
];

const CALENDAR_TABLES: TableName[] = [
  "organizations",
  "competitions",
  "teams",
  "fixtures",
  "activities",
  "activity_categories",
];

const MATCH_REPORT_TABLES: TableName[] = [
  "organizations",
  "competitions",
  "competition_formats",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "players",
  "player_positions",
  "player_team_memberships",
];

const TABLE_FETCH_TIMEOUT_MS = 8000;

function get_tables_for_page(
  page_type: "competition_results" | "calendar" | "match_report",
): TableName[] {
  switch (page_type) {
    case "competition_results":
      return COMPETITION_RESULTS_TABLES;
    case "calendar":
      return CALENDAR_TABLES;
    case "match_report":
      return MATCH_REPORT_TABLES;
  }
}

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

async function fetch_and_store_table(
  convex_query: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>,
  table_name: TableName,
): Promise<number> {
  const query_promise = convex_query("sync:get_all_records", { table_name });
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

export async function fetch_public_data_from_convex(
  page_type: "competition_results" | "calendar" | "match_report",
): Promise<PublicDataFetchResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.warn(
      `[PublicData] Device is offline, skipping Convex fetch for ${page_type}`,
    );
    return {
      success: false,
      tables_fetched: 0,
      total_records: 0,
      error: "offline",
    };
  }

  const manager = get_sync_manager();
  const convex_client = manager.get_convex_client();

  if (!convex_client) {
    console.warn(
      "[PublicData] Convex client not available, using local data only",
    );
    return {
      success: false,
      tables_fetched: 0,
      total_records: 0,
      error: "convex_not_available",
    };
  }

  const tables = get_tables_for_page(page_type);
  let tables_fetched = 0;
  let total_records = 0;
  const failed_tables: string[] = [];

  console.log(
    `[PublicData] Fetching ${tables.length} tables from Convex for ${page_type}...`,
  );

  for (const table_name of tables) {
    try {
      const records_count = await fetch_and_store_table(
        convex_client.query,
        table_name,
      );
      total_records += records_count;
      tables_fetched++;
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[PublicData] Failed to fetch ${table_name}: ${error_message}`,
      );
      failed_tables.push(table_name);
    }
  }

  const all_succeeded = failed_tables.length === 0;

  console.log(
    `[PublicData] Fetch complete: ${tables_fetched}/${tables.length} tables, ${total_records} total records` +
      (failed_tables.length > 0
        ? ` (failed: ${failed_tables.join(", ")})`
        : ""),
  );

  return {
    success: all_succeeded,
    tables_fetched,
    total_records,
    error: all_succeeded ? null : `Failed tables: ${failed_tables.join(", ")}`,
  };
}
