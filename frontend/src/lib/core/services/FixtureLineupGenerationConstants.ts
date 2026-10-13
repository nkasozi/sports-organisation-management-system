export const FIXTURE_LINEUP_GENERATION_LOG_SCOPE = "[FixtureLineupGeneration]";

export const FIXTURE_LINEUP_GENERATION_EVENT = {
  STARTED: "lineup_auto_generation_started",
  RULES_RESOLVED: "lineup_auto_generation_rules_resolved",
  RULES_LOAD_FAILED: "lineup_auto_generation_rules_load_failed",
  PREVIOUS_LINEUP_LOOKUP_FAILED:
    "lineup_auto_generation_previous_lookup_failed",
  PREVIOUS_LINEUP_NOT_FOUND: "lineup_auto_generation_previous_not_found",
  PREVIOUS_LINEUP_FOUND: "lineup_auto_generation_previous_found",
  MEMBERSHIPS_LOAD_FAILED: "lineup_auto_generation_memberships_load_failed",
  PLAYER_LOAD_FAILED: "lineup_auto_generation_player_load_failed",
  POSITIONS_LOAD_FAILED: "lineup_auto_generation_positions_load_failed",
  INSUFFICIENT_PLAYERS: "lineup_auto_generation_insufficient_players",
  SAVE_FAILED: "lineup_auto_generation_save_failed",
  CREATED: "lineup_auto_generation_created",
  MISSING_FIXTURE_ID: "lineup_auto_generation_missing_fixture_id",
} as const;

export const FIXTURE_LINEUP_GENERATION_MESSAGES = {
  MISSING_FIXTURE_ID: "Fixture must have an ID",
  COMPETITION_LOAD_FAILED: "Could not load competition",
  ORGANIZATION_LOAD_FAILED:
    "Could not load the organization for this competition to work out player limits",
  SPORT_LOAD_FAILED:
    "Could not load the sport for this competition to work out player limits",
  PREVIOUS_LINEUP_LOOKUP_FAILED:
    "Could not load the previous match squad. Please try again.",
  MEMBERSHIPS_LOAD_FAILED:
    "Could not load the team's player memberships. Please try again.",
  SAVE_FAILED: "Failed to create lineup",
  PREVIOUS_MATCH_NOTES: "Auto-generated from previous match squad",
  FIRST_AVAILABLE_NOTES: "Auto-generated lineup (first available players)",
  insufficient_players: (
    team_name: string,
    active_count: number,
    min_players: number,
  ): string =>
    `${team_name} has only ${active_count} active player(s), but minimum is ${min_players}`,
  insufficient_players_fix: (team_name: string, shortfall: number): string =>
    `Go to the Player Team Memberships page and add more players to ${team_name} (need at least ${shortfall} more)`,
  previous_match_used: (team_name: string, player_count: number): string =>
    `Used previous match squad for ${team_name} (${player_count} players)`,
  first_available_used: (team_name: string, player_count: number): string =>
    `Selected first ${player_count} available players for ${team_name}`,
} as const;

export const DEFAULT_MIN_PLAYERS = 0;
export const DEFAULT_MAX_PLAYERS = 99;
export const DEFAULT_STARTERS_COUNT = 11;
export const NUMBER_TYPE_NAME = "number";
