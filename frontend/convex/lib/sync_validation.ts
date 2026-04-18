import type { ConvexResult, SystemUserRecord } from "./auth_middleware";

export const ALLOWED_SYNC_TABLES = [
  "organizations",
  "organization_settings",
  "competitions",
  "competition_stages",
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
] as const;

type AllowedSyncTable = (typeof ALLOWED_SYNC_TABLES)[number];

const ALLOWED_TABLE_SET = new Set<string>(ALLOWED_SYNC_TABLES);

const PUBLIC_TABLE_NAMES = [
  "organizations",
  "competitions",
  "competition_formats",
  "competition_stages",
  "competition_teams",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "activities",
  "activity_categories",
  "players",
  "player_positions",
  "player_team_memberships",
] as const;

export const PUBLIC_TABLES = new Set<string>(PUBLIC_TABLE_NAMES);

export function is_public_table(table_name: string): boolean {
  return PUBLIC_TABLES.has(table_name);
}

const TABLE_TO_ENTITY_TYPE: Record<string, string> = {
  organizations: "organization",
  organization_settings: "organizationsettings",
  competitions: "competition",
  competition_stages: "competitionstage",
  teams: "team",
  players: "player",
  officials: "official",
  fixtures: "fixture",
  sports: "sport",
  team_staff: "teamstaff",
  team_staff_roles: "teamstaffrole",
  game_official_roles: "gameofficialrole",
  venues: "venue",
  jersey_colors: "jerseycolor",
  player_positions: "playerposition",
  player_profiles: "playerprofile",
  team_profiles: "teamprofile",
  profile_links: "profilelink",
  calendar_tokens: "calendartoken",
  competition_formats: "competitionformat",
  competition_teams: "competitionteam",
  player_team_memberships: "playerteammembership",
  fixture_details_setups: "fixturedetailssetup",
  fixture_lineups: "fixturelineup",
  activities: "activity",
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
  official_associated_teams: "officialassociatedteam",
  official_performance_ratings: "officialperformancerating",
};

const GLOBAL_TABLES = new Set<string>([
  "sports",
  "genders",
  "player_positions",
  "identification_types",
  "competition_formats",
  "game_event_types",
  "team_staff_roles",
  "game_official_roles",
  "jersey_colors",
  "activity_categories",
]);

export function validate_table_name(
  table_name: string,
): ConvexResult<AllowedSyncTable> {
  if (!ALLOWED_TABLE_SET.has(table_name))
    return {
      success: false,
      error: `Table "${table_name}" is not an allowed sync table`,
    };
  return { success: true, data: table_name as AllowedSyncTable };
}

export function get_entity_type_for_table(table_name: string): string {
  return TABLE_TO_ENTITY_TYPE[table_name] ?? table_name;
}

export function is_global_table(table_name: string): boolean {
  return GLOBAL_TABLES.has(table_name);
}

const EMPTY_SCOPE_VALUE = "";
const GLOBAL_ORGANIZATION_ID = "*";

function get_record_field_value(
  record: Record<string, unknown>,
  field_name: string,
): string {
  const field_value = record[field_name];
  return typeof field_value === "string" ? field_value : EMPTY_SCOPE_VALUE;
}

export function is_global_record(record: Record<string, unknown>): boolean {
  const organization_id = get_record_field_value(record, "organization_id");
  return (
    organization_id === GLOBAL_ORGANIZATION_ID ||
    organization_id === EMPTY_SCOPE_VALUE
  );
}

export function validate_record_organization_ownership(
  record_data: Record<string, unknown>,
  caller: SystemUserRecord,
  table_name: string,
): ConvexResult<true> {
  if (is_global_table(table_name)) return { success: true, data: true };
  if (caller.organization_id === GLOBAL_ORGANIZATION_ID)
    return { success: true, data: true };

  const record_organization_id = get_record_field_value(
    record_data,
    "organization_id",
  );

  if (is_global_record(record_data)) return { success: true, data: true };
  if (record_organization_id !== caller.organization_id) {
    return {
      success: false,
      error: "Record organization does not match caller organization",
    };
  }

  return { success: true, data: true };
}

export function filter_records_by_organization_scope(
  records: Array<Record<string, unknown>>,
  caller: SystemUserRecord,
  table_name: string,
  scope_filter: Record<string, string>,
): Array<Record<string, unknown>> {
  if (
    caller.organization_id === GLOBAL_ORGANIZATION_ID ||
    is_global_table(table_name)
  )
    return records;

  const caller_organization_id = get_record_field_value(
    scope_filter,
    "organization_id",
  );
  if (!caller_organization_id) return records;

  if (table_name === "organizations") {
    return records.filter(
      (record) =>
        get_record_field_value(record, "local_id") === caller_organization_id,
    );
  }

  return records.filter((record) => {
    if (is_global_record(record)) return true;

    const scoped_team_id = get_record_field_value(scope_filter, "team_id");
    if (scoped_team_id) {
      return (
        get_record_field_value(record, "organization_id") ===
          caller_organization_id &&
        get_record_field_value(record, "team_id") === scoped_team_id
      );
    }

    return (
      get_record_field_value(record, "organization_id") ===
      caller_organization_id
    );
  });
}
