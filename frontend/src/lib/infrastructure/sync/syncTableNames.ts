import type { SharedEntityType } from "$convex/shared_permission_definitions";
import type { UserRole } from "$lib/core/interfaces/ports";
import { check_entity_permission } from "$lib/core/interfaces/ports";

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

function role_can_push_table(role: UserRole, table_name: TableName): boolean {
  const entity_type = TABLE_NAME_TO_ENTITY_TYPE[table_name];
  if (!entity_type) return true;
  return (
    check_entity_permission(role, entity_type, "create") ||
    check_entity_permission(role, entity_type, "update")
  );
}

export function get_push_excluded_tables(role: UserRole): Set<string> {
  return new Set(
    TABLE_NAMES.filter((table_name) => !role_can_push_table(role, table_name)),
  );
}

export function get_push_excluded_tables_for_unsigned_user(): Set<string> {
  return new Set(TABLE_NAMES);
}
