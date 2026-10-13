import type { AllowedSyncTable } from "./sync_table_catalog";

export const TableTenancyStrategy = {
  SHARED_REFERENCE: "shared_reference",
  ORGANIZATION_FIELD: "organization_field",
  ORGANIZATION_IDENTITY: "organization_identity",
  PARENT_SCOPED: "parent_scoped",
} as const;

type TableTenancyStrategyValue =
  (typeof TableTenancyStrategy)[keyof typeof TableTenancyStrategy];

const SHARED = TableTenancyStrategy.SHARED_REFERENCE;
const OWNED = TableTenancyStrategy.ORGANIZATION_FIELD;
const PARENT = TableTenancyStrategy.PARENT_SCOPED;

export const TABLE_TENANCY_STRATEGIES: Record<
  AllowedSyncTable,
  TableTenancyStrategyValue
> = {
  organizations: TableTenancyStrategy.ORGANIZATION_IDENTITY,
  organization_settings: OWNED,
  competitions: OWNED,
  competition_stages: PARENT,
  teams: OWNED,
  players: OWNED,
  officials: OWNED,
  fixtures: OWNED,
  sports: SHARED,
  team_staff: OWNED,
  team_staff_roles: SHARED,
  game_official_roles: SHARED,
  venues: OWNED,
  jersey_colors: SHARED,
  player_positions: SHARED,
  player_profiles: PARENT,
  team_profiles: PARENT,
  profile_links: PARENT,
  calendar_tokens: OWNED,
  competition_formats: SHARED,
  competition_teams: PARENT,
  player_team_memberships: OWNED,
  fixture_details_setups: OWNED,
  fixture_lineups: OWNED,
  activities: OWNED,
  activity_categories: SHARED,
  system_users: OWNED,
  identification_types: SHARED,
  identifications: PARENT,
  qualifications: PARENT,
  game_event_types: SHARED,
  genders: SHARED,
  live_game_logs: OWNED,
  game_event_logs: OWNED,
  player_team_transfer_histories: OWNED,
  official_associated_teams: PARENT,
  official_performance_ratings: OWNED,
};

export function get_table_tenancy_strategy(
  table_name: AllowedSyncTable,
): TableTenancyStrategyValue {
  return TABLE_TENANCY_STRATEGIES[table_name];
}
