export const FIXTURE_LINEUP_LOG_SCOPE = "[FixtureLineupUseCases]";

export const FIXTURE_LINEUP_ENTITY_TYPE = "fixturelineup";

export const LINEUP_ACTION = {
  SUBMIT: "submit",
  LOCK: "lock",
  UPDATE: "update",
  DELETE: "delete",
  RECORD_LIVE_TIMES: "record_live_times",
} as const;

export type LineupAction = (typeof LINEUP_ACTION)[keyof typeof LINEUP_ACTION];

export type LineupStatusTransitionAction =
  | typeof LINEUP_ACTION.SUBMIT
  | typeof LINEUP_ACTION.LOCK;

export type LineupEditAction =
  | typeof LINEUP_ACTION.UPDATE
  | typeof LINEUP_ACTION.DELETE;

export const FIXTURE_LINEUP_EVENT = {
  ID_MISSING: "fixture_lineup_id_missing",
  FIXTURE_ID_MISSING: "fixture_lineup_fixture_id_missing",
  TEAM_ID_MISSING: "fixture_lineup_team_id_missing",
  NOT_FOUND: "fixture_lineup_not_found",
  ALREADY_EXISTS: "fixture_lineup_already_exists",
  TRANSITION_REJECTED: "fixture_lineup_transition_rejected",
  LIST_FAILED: "fixture_lineup_list_failed",
  LOOKUP_FAILED: "fixture_lineup_lookup_failed",
  CREATE_FAILED: "fixture_lineup_create_failed",
  UPDATE_FAILED: "fixture_lineup_update_failed",
  DELETE_FAILED: "fixture_lineup_delete_failed",
  FIXTURE_LOOKUP_FAILED: "fixture_lineup_fixture_lookup_failed",
  LIVE_TIMES_REJECTED: "fixture_lineup_live_times_rejected",
} as const;

export const FIXTURE_LINEUP_MESSAGE = {
  ID_REQUIRED: "FixtureLineup ID is required",
  FIXTURE_ID_REQUIRED: "Fixture ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  NOT_FOUND: "Lineup not found",
  ALREADY_EXISTS: "A lineup already exists for this team in this fixture",
  ALREADY_SUBMITTED: "Lineup is already submitted",
  ALREADY_LOCKED: "Lineup is already locked",
  GAME_ALREADY_STARTED:
    "This lineup can't be changed because the game is no longer scheduled. Record substitutions from the live game screen instead.",
  LIVE_TIMES_NOT_ALLOWED:
    "Player times can only be recorded while the game is scheduled or in progress.",
  LIVE_TIMES_ONLY:
    "During a game only player on and off times can change. Players, numbers and positions stay as submitted.",
  FIXTURE_LOOKUP_FAILED:
    "We couldn't check this lineup's game. Please refresh and try again.",
} as const;

export function build_locked_lineup_message(action: LineupAction): string {
  return `Cannot ${action} a locked lineup`;
}

export function build_empty_lineup_message(action: LineupAction): string {
  return `Cannot ${action} an empty lineup`;
}
