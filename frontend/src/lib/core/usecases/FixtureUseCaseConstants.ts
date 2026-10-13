export const FIXTURE_LOG_SCOPE = "[FixtureUseCases]";

export const FIXTURE_ENTITY_TYPE = "fixture";

export const FIXTURE_DISPLAY_FALLBACK_NAME = "Fixture";

export const MINIMUM_ROUND_NUMBER = 1;

export const MINIMUM_GENERATION_TEAMS = 2;

export const FIXTURE_EVENT = {
  ID_MISSING: "fixture_id_missing",
  COMPETITION_ID_MISSING: "fixture_competition_id_missing",
  TEAM_ID_MISSING: "fixture_team_id_missing",
  VALIDATION_FAILED: "fixture_validation_failed",
  GENERATION_INVALID: "fixture_generation_invalid",
  ROUND_INVALID: "fixture_round_invalid",
  SCORE_INVALID: "fixture_score_invalid",
  NOT_FOUND: "fixture_not_found",
  LIST_FAILED: "fixture_list_failed",
  LOOKUP_FAILED: "fixture_lookup_failed",
  CREATE_FAILED: "fixture_create_failed",
  UPDATE_FAILED: "fixture_update_failed",
  DELETE_FAILED: "fixture_delete_failed",
  GENERATE_FAILED: "fixture_generate_failed",
  PREVIOUS_STATE_UNAVAILABLE: "fixture_previous_state_unavailable",
  TEAM_NAMES_UNAVAILABLE: "fixture_team_names_unavailable",
  TRANSITION_REJECTED: "fixture_transition_rejected",
  EVENT_ALREADY_RECORDED: "fixture_game_event_already_recorded",
} as const;

export const FIXTURE_MESSAGE = {
  ID_REQUIRED: "Fixture ID is required",
  COMPETITION_ID_REQUIRED: "Competition ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  NOT_FOUND: "Fixture not found",
  ROUND_TOO_LOW: "Round number must be at least 1",
  TEAMS_TOO_FEW: "At least 2 teams are required",
  START_DATE_REQUIRED: "Start date is required",
  NEGATIVE_SCORE: "Scores cannot be negative",
} as const;

export function build_unmapped_rounds_message(rounds: number[]): string {
  return `All rounds must be mapped to a stage. Missing stage mappings for rounds: ${rounds.join(", ")}`;
}
