import {
  get_database,
  type SportsOrgDatabase,
} from "../../adapters/repositories/database";
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

const TABLE_NAMES = [
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
] as const;

type TableName = (typeof TABLE_NAMES)[number];

const SYNC_METADATA_KEY = "convex_sync_metadata";

interface SyncMetadata {
  last_sync_at: string;
  table_versions: Record<string, number>;
}

function get_sync_metadata(): SyncMetadata {
  const stored = localStorage.getItem(SYNC_METADATA_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    last_sync_at: "1970-01-01T00:00:00.000Z",
    table_versions: {},
  };
}

function save_sync_metadata(metadata: SyncMetadata): void {
  localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
}

function get_table_from_database(
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
  };

  return table_map[table_name] || null;
}

async function push_table_to_convex(
  convex_client: ConvexClient,
  database: SportsOrgDatabase,
  table_name: TableName,
  last_sync_at: string,
  detect_conflicts: boolean = true,
): Promise<{
  success: boolean;
  records_pushed: number;
  error: string | null;
  conflicts: ConflictFromServer[];
}> {
  const table = get_table_from_database(database, table_name);
  if (!table) {
    return {
      success: false,
      records_pushed: 0,
      error: `Table ${table_name} not found`,
      conflicts: [],
    };
  }

  const all_records = await table.toArray();
  const records_to_sync = all_records.filter((record) => {
    const record_timestamp =
      record.updated_at || record.created_at || "1970-01-01T00:00:00.000Z";
    return record_timestamp > last_sync_at;
  });

  if (records_to_sync.length === 0) {
    return { success: true, records_pushed: 0, error: null, conflicts: [] };
  }

  const batch_size = 25;
  let total_pushed = 0;
  const all_conflicts: ConflictFromServer[] = [];

  try {
    for (let i = 0; i < records_to_sync.length; i += batch_size) {
      const batch = records_to_sync.slice(i, i + batch_size);
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
        results: Array<{ local_id: string; success: boolean; action: string }>;
        has_conflicts: boolean;
        conflicts: ConflictFromServer[];
      };

      if (result.has_conflicts && result.conflicts.length > 0) {
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
    console.error(`[Sync] Push failed for ${table_name}:`, error_message);
    return {
      success: false,
      records_pushed: total_pushed,
      error: error_message,
      conflicts: all_conflicts,
    };
  }

  return {
    success: true,
    records_pushed: total_pushed,
    error: null,
    conflicts: all_conflicts,
  };
}

async function pull_table_from_convex(
  convex_client: ConvexClient,
  database: SportsOrgDatabase,
  table_name: TableName,
  last_sync_at: string,
): Promise<{ success: boolean; records_pulled: number; error: string | null }> {
  const table = get_table_from_database(database, table_name);
  if (!table) {
    return {
      success: false,
      records_pulled: 0,
      error: `Table ${table_name} not found`,
    };
  }

  try {
    const remote_changes = (await convex_client.query(
      "sync:get_changes_since",
      {
        table_name,
        since_timestamp: last_sync_at,
      },
    )) as ConvexRecord[];

    if (!remote_changes || remote_changes.length === 0) {
      return { success: true, records_pulled: 0, error: null };
    }

    let records_pulled = 0;

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
          "1970-01-01T00:00:00.000Z";
        const remote_timestamp =
          remote_record.synced_at || "1970-01-01T00:00:00.000Z";

        if (remote_timestamp > local_timestamp) {
          await table.put(local_data as unknown as { id: string });
          records_pulled++;
        }
      } else {
        await table.put(local_data as unknown as { id: string });
        records_pulled++;
      }
    }

    return { success: true, records_pulled, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Pull failed for ${table_name}:`, error_message);
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
  const metadata = get_sync_metadata();
  const errors: Array<{ table_name: string; error: string }> = [];
  const all_conflicts: Array<{
    table_name: string;
    conflicts: ConflictFromServer[];
  }> = [];

  let total_pushed = 0;
  let total_pulled = 0;
  let tables_synced = 0;

  const total_tables = enabled_tables.filter((t) =>
    TABLE_NAMES.includes(t as TableName),
  ).length;
  let tables_completed = 0;

  for (const table_name of enabled_tables) {
    if (!TABLE_NAMES.includes(table_name as TableName)) {
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

    if (direction === "push" || direction === "bidirectional") {
      const push_result = await push_table_to_convex(
        convex_client,
        database,
        table_name as TableName,
        metadata.last_sync_at,
        detect_conflicts,
      );

      if (!push_result.success) {
        errors.push({ table_name, error: push_result.error || "Push failed" });
        progress.status = "error";
        progress.error_message = push_result.error;
      } else {
        total_pushed += push_result.records_pushed;
        progress.synced_records += push_result.records_pushed;

        if (push_result.conflicts.length > 0) {
          all_conflicts.push({ table_name, conflicts: push_result.conflicts });
          progress.status = "conflict";
        }
      }
    }

    if (direction === "pull" || direction === "bidirectional") {
      const pull_result = await pull_table_from_convex(
        convex_client,
        database,
        table_name as TableName,
        metadata.last_sync_at,
      );

      if (!pull_result.success) {
        errors.push({ table_name, error: pull_result.error || "Pull failed" });
        progress.status = "error";
        progress.error_message = pull_result.error;
      } else {
        total_pulled += pull_result.records_pulled;
        progress.synced_records += pull_result.records_pulled;
      }
    }

    tables_completed++;

    if (progress.status !== "error") {
      progress.status = "success";
      tables_synced++;
    }

    progress.tables_completed = tables_completed;
    progress.percentage = Math.round((tables_completed / total_tables) * 100);

    if (on_progress) {
      on_progress(progress);
    }
  }

  const new_metadata: SyncMetadata = {
    last_sync_at: new Date().toISOString(),
    table_versions: metadata.table_versions,
  };
  save_sync_metadata(new_metadata);

  const has_conflicts = all_conflicts.length > 0;

  return {
    success: errors.length === 0 && !has_conflicts,
    tables_synced,
    records_pushed: total_pushed,
    records_pulled: total_pulled,
    errors,
    duration_ms: Date.now() - start_time,
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
  const metadata = get_sync_metadata();
  return metadata.last_sync_at;
}

export function reset_sync_metadata(): void {
  localStorage.removeItem(SYNC_METADATA_KEY);
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
