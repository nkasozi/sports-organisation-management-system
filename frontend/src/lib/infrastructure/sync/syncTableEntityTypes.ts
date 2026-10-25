import type { SharedEntityType } from "$convex/shared_permission_definitions";

import type { TableName } from "./syncTableNames";

export const TABLE_NAME_TO_ENTITY_TYPE: Partial<
  Record<TableName, SharedEntityType>
> = {
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

export function get_entity_type_for_table(table_name: string): string {
  return (
    TABLE_NAME_TO_ENTITY_TYPE[table_name as TableName] ??
    table_name.replace(/_/g, "")
  );
}
