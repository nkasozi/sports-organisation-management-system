import type { SharedEntityType } from "$convex/shared_permission_definitions";
import type { SyncDirection, UserRole } from "$lib/core/interfaces/ports";
import { check_entity_permission } from "$lib/core/interfaces/ports";
import type {
  EntityId,
  IsoDateTimeString,
  ScalarInput,
} from "$lib/core/types/DomainScalars";

import type { ConflictRecord, ConflictResolution } from "./conflictTypes";

export type { SyncDirection };
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
  local_id: ScalarInput<ConflictRecord>["local_id"];
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_version: number;
  remote_updated_at: ScalarInput<ConflictRecord>["remote_updated_at"];
  remote_updated_by: ScalarInput<ConflictRecord>["remote_updated_by"];
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

export interface ConvexRecord {
  _id: string;
  local_id: EntityId;
  synced_at: IsoDateTimeString;
  version: number;
  [key: string]: unknown;
}

export interface ConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface RemoteTableState {
  record_count: number;
  latest_modified_at: ConvexRecord["synced_at"] | null;
}

export interface ConflictResolutionRequest {
  table_name: string;
  local_id: ScalarInput<ConflictRecord>["local_id"];
  resolved_data: Record<string, unknown>;
  resolution_action: "keep_local" | "keep_remote" | "merge";
  resolved_by?: ScalarInput<ConflictResolution>["resolved_by"];
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
  "competition_stages",
  "competition_teams",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "activity_categories",
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
  "official_performance_ratings",
  "organization_settings",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

const TABLE_NAME_TO_ENTITY_TYPE: Partial<Record<TableName, SharedEntityType>> =
  {
    organizations: "organization",
    organization_settings: "organizationsettings",
    sports: "sport",
    competitions: "competition",
    teams: "team",
    players: "player",
    officials: "official",
    fixtures: "fixture",
    team_staff: "teamstaff",
    team_staff_roles: "teamstaffrole",
    game_official_roles: "gameofficialrole",
    venues: "venue",
    jersey_colors: "jerseycolor",
    player_positions: "playerposition",
    player_profiles: "playerprofile",
    team_profiles: "teamprofile",
    profile_links: "profilelink",
    competition_formats: "competitionformat",
    competition_teams: "competitionteam",
    player_team_memberships: "playerteammembership",
    fixture_details_setups: "fixturedetailssetup",
    fixture_lineups: "fixturelineup",
    activity_categories: "activitycategory",
    system_users: "systemuser",
    identification_types: "identificationtype",
    identifications: "identification",
    qualifications: "qualification",
    game_event_types: "gameeventtype",
    genders: "gender",
    live_game_logs: "livegamelog",
    game_event_logs: "gameeventlog",
    player_team_transfer_histories: "playerteamtransferhistory",
    official_performance_ratings: "officialperformancerating",
  };

export const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z" as IsoDateTimeString;

function role_can_push_table(role: UserRole, table_name: TableName): boolean {
  const entity_type = TABLE_NAME_TO_ENTITY_TYPE[table_name];
  if (!entity_type) return true;
  return (
    check_entity_permission(role, entity_type, "create") ||
    check_entity_permission(role, entity_type, "update")
  );
}

export function get_push_excluded_tables(role: UserRole | null): Set<string> {
  if (!role) return new Set(TABLE_NAMES);
  return new Set(
    TABLE_NAMES.filter((table_name) => !role_can_push_table(role, table_name)),
  );
}
