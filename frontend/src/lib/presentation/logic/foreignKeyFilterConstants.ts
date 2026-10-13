import type { ForeignKeyFilterConfig } from "$lib/core/entities/BaseEntity";

export const FOREIGN_KEY_FILTER_TYPE = {
  TEAM_JERSEY_FROM_FIXTURE: "team_jersey_from_fixture",
  OFFICIAL_JERSEY_FROM_COMPETITION: "official_jersey_from_competition",
  HOLDER_TYPE_FILTER: "holder_type_filter",
  TEAMS_FROM_COMPETITION: "teams_from_competition",
  STAGES_FROM_COMPETITION: "stages_from_competition",
  COMPETITIONS_FROM_ORGANIZATION: "competitions_from_organization",
  FIXTURES_FROM_ORGANIZATION: "fixtures_from_organization",
  TEAMS_FROM_ORGANIZATION: "teams_from_organization",
  PLAYERS_FROM_ORGANIZATION: "players_from_organization",
  OFFICIALS_FROM_ORGANIZATION: "officials_from_organization",
  LIVE_GAME_LOGS_FROM_ORGANIZATION: "live_game_logs_from_organization",
  TEAMS_FROM_PLAYER_MEMBERSHIPS: "teams_from_player_memberships",
  TEAMS_EXCLUDING_PLAYER_MEMBERSHIPS: "teams_excluding_player_memberships",
  LOOKUP_FROM_ORGANIZATION: "lookup_from_organization",
  EXCLUDE_SELECTED_FIELD: "exclude_selected_field",
  FIXTURES_FROM_OFFICIAL: "fixtures_from_official",
  FIXTURES_FOR_RATING: "fixtures_for_rating",
  OFFICIALS_FROM_FIXTURE: "officials_from_fixture",
  FIXTURES_WITHOUT_SETUP: "fixtures_without_setup",
} as const satisfies Record<string, ForeignKeyFilterConfig["filter_type"]>;

export const FOREIGN_KEY_FILTER_TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
} as const satisfies Record<
  string,
  NonNullable<ForeignKeyFilterConfig["team_side"]>
>;
