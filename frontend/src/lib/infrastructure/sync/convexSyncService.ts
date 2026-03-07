import {
  get_database,
  type SportsOrgDatabase,
} from "../../adapters/repositories/database";
import { set_pulling_from_remote } from "./syncState";
import type { Table } from "dexie";

export type SyncDirection = "push" | "pull" | "bidirectional";
export type SyncStatus = "idle" | "syncing" | "success" | "error" | "conflict";

export interface SyncProgress {
  table_name: string;
  total_records: number;
  synced_records: number;
  status: SyncStatus;
  error_message: string | null;
  tables_completed: number;
  total_tables: number;
  percentage: number;
}

export interface ConflictFromServer {
  local_id: string;
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_version: number;
  remote_updated_at: string;
  remote_updated_by: string | null;
}

export interface SyncResult {
  success: boolean;
  tables_synced: number;
  records_pushed: number;
  records_pulled: number;
  errors: Array<{ table_name: string; error: string }>;
  duration_ms: number;
  conflicts: Array<{ table_name: string; conflicts: ConflictFromServer[] }>;
}

export interface SyncConfig {
  convex_url: string;
  sync_interval_ms: number;
  enabled_tables: string[];
  direction: SyncDirection;
}

interface ConvexRecord {
  _id: string;
  local_id: string;
  synced_at: string;
  version: number;
  [key: string]: unknown;
}

interface ConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export const TABLE_NAMES = [
  "organizations",
  "competitions",
  "teams",
  "players",
  "officials",
  "fixtures",
  "sports",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "venues",
  "jersey_colors",
  "player_positions",
  "player_profiles",
  "team_profiles",
  "profile_links",
  "calendar_tokens",
  "competition_formats",
  "competition_teams",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "activity_categories",
  "audit_logs",
  "system_users",
  "identification_types",
  "identifications",
  "qualifications",
  "game_event_types",
  "genders",
  "live_game_logs",
  "game_event_logs",
  "player_team_transfer_histories",
  "official_associated_teams",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z";

interface RemoteTableState {
  record_count: number;
  latest_modified_at: string | null;
}

async function get_remote_latest_modified_at(
  convex_client: ConvexClient,
  table_name: string,
): Promise<RemoteTableState> {
  const result = (await convex_client.query("sync:get_latest_modified_at", {
    table_name,
  })) as RemoteTableState;
  return result;
}

export function get_local_latest_modified_at(
  all_records: Array<{ id: string; updated_at?: string; created_at?: string }>,
): string {
  return all_records.reduce((max, record) => {
    const timestamp = record.updated_at || record.created_at || EPOCH_TIMESTAMP;
    return timestamp > max ? timestamp : max;
  }, EPOCH_TIMESTAMP);
}

export function get_table_from_database(
  database: SportsOrgDatabase,
  table_name: TableName,
): Table<
  { id: string; updated_at?: string; created_at?: string },
  string
> | null {
  const table_map: Record<
    string,
    Table<{ id: string; updated_at?: string; created_at?: string }, string>
  > = {
    organizations: database.organizations,
    competitions: database.competitions,
    teams: database.teams,
    players: database.players,
    officials: database.officials,
    fixtures: database.fixtures,
    sports: database.sports,
    team_staff: database.team_staff,
    team_staff_roles: database.team_staff_roles,
    game_official_roles: database.game_official_roles,
    venues: database.venues,
    jersey_colors: database.jersey_colors,
    player_positions: database.player_positions,
    player_profiles: database.player_profiles,
    team_profiles: database.team_profiles,
    profile_links: database.profile_links,
    calendar_tokens: database.calendar_tokens,
    competition_formats: database.competition_formats,
    competition_teams: database.competition_teams,
    player_team_memberships: database.player_team_memberships,
    fixture_details_setups: database.fixture_details_setups,
    fixture_lineups: database.fixture_lineups,
    activities: database.activities,
    activity_categories: database.activity_categories,
    audit_logs: database.audit_logs,
    system_users: database.system_users,
    identification_types: database.identification_types,
    identifications: database.identifications,
    qualifications: database.qualifications,
    game_event_types: database.game_event_types,
    genders: database.genders,
    live_game_logs: database.live_game_logs,
    game_event_logs: database.game_event_logs,
    player_team_transfer_histories: database.player_team_transfer_histories,
    official_associated_teams: database.official_associated_teams,
  };

  return table_map[table_name] || null;
}

function is_auth_error(error_message: string | null): boolean {
  if (!error_message) return false;
  return (
    error_message.includes("authentication_required") ||
    error_message.includes("unauthorized") ||
    error_message.includes("Server rejected")
  );
}

async function verify_sync_auth(
  convex_client: ConvexClient,
): Promise<{ authenticated: boolean; error: string | null }> {
  try {
    const result = (await convex_client.query("sync:check_auth", {})) as {
      authenticated: boolean;
    };
    return { authenticated: result.authenticated, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    return { authenticated: false, error: error_message };
  }
}

async function push_table_to_convex(
  convex_client: ConvexClient,
  table_name: TableName,
  all_records: Array<{ id: string; updated_at?: string; created_at?: string }>,
  remote_latest_modified_at: string | null,
  detect_conflicts: boolean = true,
): Promise<{
  success: boolean;
  records_pushed: number;
  error: string | null;
  conflicts: ConflictFromServer[];
}> {
  const remote_cutoff = remote_latest_modified_at || EPOCH_TIMESTAMP;
  const server_is_empty = !remote_latest_modified_at;

  if (server_is_empty) {
    console.log(
      `[Sync:Push] ${table_name} — server is EMPTY, pushing all ${all_records.length} local records`,
    );
  } else {
    console.log(
      `[Sync:Push] ${table_name} — ${all_records.length} local records, server latest_modified_at: ${remote_cutoff}`,
    );
  }

  const records_to_push = server_is_empty
    ? all_records
    : all_records.filter((record) => {
        const record_modified_at =
          record.updated_at || record.created_at || EPOCH_TIMESTAMP;
        return record_modified_at > remote_cutoff;
      });

  if (records_to_push.length === 0) {
    console.log(
      `[Sync:Push] ${table_name} — no local records newer than server, nothing to push`,
    );
    return { success: true, records_pushed: 0, error: null, conflicts: [] };
  }

  console.log(
    `[Sync:Push] ${table_name} — ${records_to_push.length} records to push`,
  );

  const batch_size = 25;
  let total_pushed = 0;
  const all_conflicts: ConflictFromServer[] = [];

  try {
    for (let i = 0; i < records_to_push.length; i += batch_size) {
      const batch = records_to_push.slice(i, i + batch_size);
      const batch_number = Math.floor(i / batch_size) + 1;
      const total_batches = Math.ceil(records_to_push.length / batch_size);
      console.log(
        `[Sync:Push] ${table_name} — sending batch ${batch_number}/${total_batches} (${batch.length} records)`,
      );

      const batch_records = batch.map((record) => ({
        local_id: record.id,
        data: record,
        version: Date.now(),
      }));

      const result = (await convex_client.mutation("sync:batch_upsert", {
        table_name,
        records: batch_records,
        detect_conflicts,
      })) as {
        success: boolean;
        error?: string;
        message?: string;
        results: Array<{ local_id: string; success: boolean; action: string }>;
        has_conflicts: boolean;
        conflicts: ConflictFromServer[];
      };

      if (!result.success) {
        const auth_error_message = result.error
          ? `${result.error}: ${result.message || "unknown"}`
          : `Server rejected batch (success=false, results: ${result.results?.length ?? 0})`;
        console.error(
          `[Sync:Push] ${table_name} — batch ${batch_number} REJECTED by server: ${auth_error_message}`,
        );
        return {
          success: false,
          records_pushed: total_pushed,
          error: auth_error_message,
          conflicts: all_conflicts,
        };
      }

      console.log(
        `[Sync:Push] ${table_name} — batch ${batch_number} result: success=${result.success}, actions: ${JSON.stringify(result.results.map((r) => r.action))}`,
      );

      if (result.has_conflicts && result.conflicts.length > 0) {
        console.warn(
          `[Sync:Push] ${table_name} — batch ${batch_number} has ${result.conflicts.length} conflicts`,
        );
        all_conflicts.push(...result.conflicts);
      }

      const non_conflict_count = result.results.filter(
        (r) => r.action !== "conflict_detected",
      ).length;
      total_pushed += non_conflict_count;
    }
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Sync:Push] ${table_name} — FAILED: ${error_message}`);
    return {
      success: false,
      records_pushed: total_pushed,
      error: error_message,
      conflicts: all_conflicts,
    };
  }

  console.log(
    `[Sync:Push] ${table_name} — completed, pushed ${total_pushed} records`,
  );
  return {
    success: true,
    records_pushed: total_pushed,
    error: null,
    conflicts: all_conflicts,
  };
}

export async function pull_table_from_convex(
  convex_client: ConvexClient,
  table: Table<
    { id: string; updated_at?: string; created_at?: string },
    string
  >,
  table_name: TableName,
  local_latest_modified_at: string,
): Promise<{ success: boolean; records_pulled: number; error: string | null }> {
  try {
    console.log(
      `[Sync:Pull] ${table_name} — querying Convex for changes since local latest: ${local_latest_modified_at}`,
    );

    const remote_changes = (await convex_client.query(
      "sync:get_changes_since",
      {
        table_name,
        since_timestamp: local_latest_modified_at,
      },
    )) as ConvexRecord[];

    if (!remote_changes || remote_changes.length === 0) {
      console.log(`[Sync:Pull] ${table_name} — no remote changes found`);
      return { success: true, records_pulled: 0, error: null };
    }

    console.log(
      `[Sync:Pull] ${table_name} — found ${remote_changes.length} remote changes to process`,
    );
    let records_pulled = 0;
    let records_skipped = 0;

    set_pulling_from_remote(true);

    try {
      for (const remote_record of remote_changes) {
        const local_id = remote_record.local_id;
        const existing_local = await table.get(local_id);

        const local_data = { ...remote_record } as Record<string, unknown>;
        delete local_data._id;
        delete local_data.local_id;
        delete local_data.synced_at;
        delete local_data.version;
        local_data.id = local_id;

        if (existing_local) {
          const local_timestamp =
            existing_local.updated_at ||
            existing_local.created_at ||
            EPOCH_TIMESTAMP;
          const remote_timestamp =
            ((remote_record as Record<string, unknown>).updated_at as string) ||
            remote_record.synced_at ||
            EPOCH_TIMESTAMP;

          if (remote_timestamp > local_timestamp) {
            await table.put(local_data as unknown as { id: string });
            records_pulled++;
          } else {
            records_skipped++;
          }
        } else {
          await table.put(local_data as unknown as { id: string });
          records_pulled++;
        }
      }
    } finally {
      set_pulling_from_remote(false);
    }

    console.log(
      `[Sync:Pull] ${table_name} — completed: pulled ${records_pulled}, skipped ${records_skipped} (local was newer)`,
    );
    return { success: true, records_pulled, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Sync:Pull] ${table_name} — FAILED: ${error_message}`);
    return {
      success: false,
      records_pulled: 0,
      error: error_message,
    };
  }
}

export async function sync_all_tables(
  convex_client: ConvexClient,
  direction: SyncDirection = "bidirectional",
  enabled_tables: string[] = [...TABLE_NAMES],
  on_progress?: (progress: SyncProgress) => void,
  detect_conflicts: boolean = true,
): Promise<SyncResult> {
  const start_time = Date.now();
  const database = get_database();
  const errors: Array<{ table_name: string; error: string }> = [];
  const all_conflicts: Array<{
    table_name: string;
    conflicts: ConflictFromServer[];
  }> = [];

  let total_pushed = 0;
  let total_pulled = 0;
  let tables_synced = 0;
  let auth_failed = false;

  const valid_tables = enabled_tables.filter((t) =>
    TABLE_NAMES.includes(t as TableName),
  );
  const total_tables = valid_tables.length;
  let tables_completed = 0;

  console.log(
    `[Sync] ===== Starting sync: direction=${direction}, tables=${total_tables} =====`,
  );

  if (direction !== "pull") {
    const auth_check = await verify_sync_auth(convex_client);
    if (!auth_check.authenticated) {
      const auth_error = auth_check.error
        ? `Auth verification failed: ${auth_check.error}`
        : "Convex client is NOT authenticated — cannot push data. Check Clerk session and JWT template.";
      console.error(`[Sync] ${auth_error}`);
      return {
        success: false,
        tables_synced: 0,
        records_pushed: 0,
        records_pulled: 0,
        errors: [{ table_name: "auth_check", error: auth_error }],
        duration_ms: Date.now() - start_time,
        conflicts: [],
      };
    }
    console.log("[Sync] Auth verified — Convex client is authenticated");
  }

  for (const table_name of valid_tables) {
    if (auth_failed) {
      console.warn(
        `[Sync] ${table_name} — SKIPPED (auth failed on earlier table)`,
      );
      tables_completed++;
      continue;
    }

    const percentage = Math.round((tables_completed / total_tables) * 100);

    const progress: SyncProgress = {
      table_name,
      total_records: 0,
      synced_records: 0,
      status: "syncing",
      error_message: null,
      tables_completed,
      total_tables,
      percentage,
    };

    if (on_progress) {
      on_progress(progress);
    }

    let table_had_error = false;

    const table = get_table_from_database(database, table_name as TableName);
    if (!table) {
      console.warn(
        `[Sync] ${table_name} — table not found in database, skipping`,
      );
      errors.push({ table_name, error: `Table ${table_name} not found` });
      tables_completed++;
      continue;
    }

    const all_local_records = await table.toArray();
    const local_latest = get_local_latest_modified_at(all_local_records);

    let remote_state: RemoteTableState = {
      record_count: 0,
      latest_modified_at: null,
    };
    try {
      remote_state = await get_remote_latest_modified_at(
        convex_client,
        table_name,
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Sync] ${table_name} — failed to get remote state: ${error_message}`,
      );
      errors.push({ table_name, error: error_message });
      tables_completed++;
      continue;
    }

    const remote_latest = remote_state.latest_modified_at || EPOCH_TIMESTAMP;
    const local_is_ahead = local_latest > remote_latest;
    const remote_is_ahead = remote_latest > local_latest;

    console.log(
      `[Sync] ${table_name} — local: ${all_local_records.length} records (latest: ${local_latest}), remote: ${remote_state.record_count} records (latest: ${remote_latest}), ${local_is_ahead ? "LOCAL ahead" : remote_is_ahead ? "REMOTE ahead" : "IN SYNC"}`,
    );

    if (local_is_ahead || direction === "push") {
      if (direction !== "pull") {
        const push_result = await push_table_to_convex(
          convex_client,
          table_name as TableName,
          all_local_records,
          remote_state.latest_modified_at,
          detect_conflicts,
        );

        if (!push_result.success) {
          errors.push({
            table_name,
            error: push_result.error || "Push failed",
          });
          progress.status = "error";
          progress.error_message = push_result.error;
          table_had_error = true;
          auth_failed = is_auth_error(push_result.error);
        } else {
          total_pushed += push_result.records_pushed;
          progress.synced_records += push_result.records_pushed;

          if (push_result.conflicts.length > 0) {
            all_conflicts.push({
              table_name,
              conflicts: push_result.conflicts,
            });
            progress.status = "conflict";
          }
        }
      }

      if (!table_had_error && direction !== "push") {
        const pull_result = await pull_table_from_convex(
          convex_client,
          table,
          table_name as TableName,
          local_latest,
        );

        if (!pull_result.success) {
          errors.push({
            table_name,
            error: pull_result.error || "Pull failed",
          });
          progress.status = "error";
          progress.error_message = pull_result.error;
          table_had_error = true;
        } else {
          total_pulled += pull_result.records_pulled;
          progress.synced_records += pull_result.records_pulled;
        }
      }
    } else {
      const pull_result = await pull_table_from_convex(
        convex_client,
        table,
        table_name as TableName,
        local_latest,
      );

      if (!pull_result.success) {
        errors.push({
          table_name,
          error: pull_result.error || "Pull failed",
        });
        progress.status = "error";
        progress.error_message = pull_result.error;
        table_had_error = true;
      } else {
        total_pulled += pull_result.records_pulled;
        progress.synced_records += pull_result.records_pulled;
      }

      if (!table_had_error && direction !== "pull") {
        const refreshed_records = await table.toArray();
        const push_result = await push_table_to_convex(
          convex_client,
          table_name as TableName,
          refreshed_records,
          remote_state.latest_modified_at,
          detect_conflicts,
        );

        if (!push_result.success) {
          errors.push({
            table_name,
            error: push_result.error || "Push failed",
          });
          progress.status = "error";
          progress.error_message = push_result.error;
          table_had_error = true;
          auth_failed = is_auth_error(push_result.error);
        } else {
          total_pushed += push_result.records_pushed;
          progress.synced_records += push_result.records_pushed;

          if (push_result.conflicts.length > 0) {
            all_conflicts.push({
              table_name,
              conflicts: push_result.conflicts,
            });
            progress.status = "conflict";
          }
        }
      }
    }

    tables_completed++;

    if (!table_had_error && progress.status !== "conflict") {
      progress.status = "success";
      tables_synced++;
    }

    progress.tables_completed = tables_completed;
    progress.percentage = Math.round((tables_completed / total_tables) * 100);

    if (on_progress) {
      on_progress(progress);
    }
  }

  const has_conflicts = all_conflicts.length > 0;
  const sync_succeeded = errors.length === 0 && !has_conflicts;
  const duration_ms = Date.now() - start_time;

  console.log(
    `[Sync] ===== Sync ${sync_succeeded ? "SUCCEEDED" : "FAILED"} in ${duration_ms}ms — ` +
      `pushed: ${total_pushed}, pulled: ${total_pulled}, tables: ${tables_synced}/${total_tables}, ` +
      `errors: ${errors.length}, conflicts: ${all_conflicts.length} =====`,
  );

  if (errors.length > 0) {
    console.warn(
      "[Sync] Errors:",
      errors.map((e) => `${e.table_name}: ${e.error}`).join("; "),
    );
  }

  return {
    success: sync_succeeded,
    tables_synced,
    records_pushed: total_pushed,
    records_pulled: total_pulled,
    errors,
    duration_ms,
    conflicts: all_conflicts,
  };
}

export async function sync_single_table(
  convex_client: ConvexClient,
  table_name: string,
  direction: SyncDirection = "bidirectional",
): Promise<SyncResult> {
  return sync_all_tables(convex_client, direction, [table_name]);
}

export function get_last_sync_timestamp(): string {
  return EPOCH_TIMESTAMP;
}

export function reset_sync_metadata(): void {
  localStorage.removeItem("convex_sync_metadata");
}

export async function clear_all_synced_tables_in_convex(): Promise<boolean> {
  const manager = get_sync_manager();
  const convex_client = (
    manager as unknown as { convex_client: ConvexClient | null }
  ).convex_client;

  if (!convex_client) {
    console.warn(
      "[Sync:Reset] Convex client not configured, skipping remote clear",
    );
    return false;
  }

  console.log("[Sync:Reset] Clearing all synced tables in Convex...");
  let total_deleted = 0;

  for (const table_name of TABLE_NAMES) {
    try {
      const result = (await convex_client.mutation("sync:clear_table", {
        table_name,
      })) as { success: boolean; deleted_count: number; error?: string };

      if (result.success) {
        total_deleted += result.deleted_count;
        if (result.deleted_count > 0) {
          console.log(
            `[Sync:Reset] ${table_name}: deleted ${result.deleted_count} records`,
          );
        }
      } else {
        console.warn(`[Sync:Reset] ${table_name}: ${result.error}`);
      }
    } catch (error) {
      console.warn(`[Sync:Reset] ${table_name}: failed — ${error}`);
    }
  }

  console.log(`[Sync:Reset] Done. Total deleted: ${total_deleted}`);
  return true;
}

export class ConvexSyncManager {
  private convex_client: ConvexClient | null = null;
  private sync_interval_id: number | null = null;
  private config: SyncConfig;
  private is_syncing = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      convex_url: config.convex_url || "",
      sync_interval_ms: config.sync_interval_ms || 30000,
      enabled_tables: config.enabled_tables || [...TABLE_NAMES],
      direction: config.direction || "bidirectional",
    };
  }

  set_convex_client(client: ConvexClient): void {
    this.convex_client = client;
  }

  is_configured(): boolean {
    return this.convex_client !== null && this.config.convex_url !== "";
  }

  async sync_now(
    on_progress?: (progress: SyncProgress) => void,
  ): Promise<SyncResult> {
    if (!this.convex_client) {
      console.error(
        "[Sync:Manager] sync_now called but Convex client is NOT configured",
      );
      return {
        success: false,
        tables_synced: 0,
        records_pushed: 0,
        records_pulled: 0,
        errors: [{ table_name: "all", error: "Convex client not configured" }],
        duration_ms: 0,
        conflicts: [],
      };
    }

    if (this.is_syncing) {
      console.warn(
        "[Sync:Manager] sync_now called but sync is already in progress, skipping",
      );
      return {
        success: false,
        tables_synced: 0,
        records_pushed: 0,
        records_pulled: 0,
        errors: [{ table_name: "all", error: "Sync already in progress" }],
        duration_ms: 0,
        conflicts: [],
      };
    }

    this.is_syncing = true;
    console.log(
      `[Sync:Manager] sync_now starting \u2014 direction: ${this.config.direction}, tables: ${this.config.enabled_tables.length}`,
    );

    const result = await sync_all_tables(
      this.convex_client,
      this.config.direction,
      this.config.enabled_tables,
      on_progress,
    );

    this.is_syncing = false;
    return result;
  }

  start_auto_sync(on_sync_complete?: (result: SyncResult) => void): void {
    if (this.sync_interval_id !== null) {
      return;
    }

    this.sync_interval_id = window.setInterval(async () => {
      const result = await this.sync_now();
      if (on_sync_complete) {
        on_sync_complete(result);
      }
    }, this.config.sync_interval_ms);
  }

  stop_auto_sync(): void {
    if (this.sync_interval_id !== null) {
      window.clearInterval(this.sync_interval_id);
      this.sync_interval_id = null;
    }
  }

  update_config(new_config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...new_config };
  }

  get_config(): SyncConfig {
    return { ...this.config };
  }

  get_sync_status(): SyncStatus {
    return this.is_syncing ? "syncing" : "idle";
  }
}

let sync_manager_instance: ConvexSyncManager | null = null;

export function get_sync_manager(): ConvexSyncManager {
  if (!sync_manager_instance) {
    sync_manager_instance = new ConvexSyncManager();
  }
  return sync_manager_instance;
}

export function initialize_sync_manager(
  config: Partial<SyncConfig>,
): ConvexSyncManager {
  sync_manager_instance = new ConvexSyncManager(config);
  return sync_manager_instance;
}

export interface ConflictResolutionRequest {
  table_name: string;
  local_id: string;
  resolved_data: Record<string, unknown>;
  resolution_action: "keep_local" | "keep_remote" | "merge";
  resolved_by?: string;
}

export async function resolve_conflict(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const new_version = Date.now();

    await convex_client.mutation("sync:force_resolve_conflict", {
      table_name: request.table_name,
      local_id: request.local_id,
      resolved_data: request.resolved_data,
      new_version,
      resolution_action: request.resolution_action,
      resolved_by: request.resolved_by || null,
    });

    const database = get_database();
    const table = get_table_from_database(
      database,
      request.table_name as TableName,
    );

    if (table) {
      const updated_record = {
        ...request.resolved_data,
        id: request.local_id,
        updated_at: new Date().toISOString(),
      } as { id: string };
      await table.put(updated_record);
    }

    return { success: true, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Conflict resolution failed:`, error_message);
    return { success: false, error: error_message };
  }
}

export async function resolve_multiple_conflicts(
  convex_client: ConvexClient,
  requests: ConflictResolutionRequest[],
): Promise<{
  success: boolean;
  resolved_count: number;
  failed_count: number;
  errors: Array<{ local_id: string; error: string }>;
}> {
  const errors: Array<{ local_id: string; error: string }> = [];
  let resolved_count = 0;

  for (const request of requests) {
    const result = await resolve_conflict(convex_client, request);
    if (result.success) {
      resolved_count++;
    } else {
      errors.push({
        local_id: request.local_id,
        error: result.error || "Unknown error",
      });
    }
  }

  return {
    success: errors.length === 0,
    resolved_count,
    failed_count: errors.length,
    errors,
  };
}
