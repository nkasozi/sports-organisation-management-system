import type { GameStatusValue } from "../entities/StatusConstants";

export const LIVE_GAME_USE_CASES_LOG_SCOPE = "[LiveGameLogUseCases]";

export const LIVE_GAME_ENTITY_TYPE = "livegamelog";

export const LIVE_GAME_UNKNOWN_STATUS_LABEL = "unknown";

export const LiveGameUseCaseEvent = {
  CREATE_FIXTURE_ID_MISSING: "live_game_create_fixture_id_missing",
  CREATE_ORGANIZATION_ID_MISSING: "live_game_create_organization_id_missing",
  CREATE_DUPLICATE_FOR_FIXTURE: "live_game_create_duplicate_for_fixture",
  CREATE_FAILED: "live_game_create_failed",
  GET_ID_MISSING: "live_game_get_id_missing",
  GET_FAILED: "live_game_get_failed",
  UPDATE_ID_MISSING: "live_game_update_id_missing",
  UPDATE_TARGET_NOT_FOUND: "live_game_update_target_not_found",
  UPDATE_FAILED: "live_game_update_failed",
  DELETE_ID_MISSING: "live_game_delete_id_missing",
  DELETE_TARGET_NOT_FOUND: "live_game_delete_target_not_found",
  DELETE_IN_PROGRESS_REJECTED: "live_game_delete_in_progress_rejected",
  DELETE_FAILED: "live_game_delete_failed",
  LIST_FAILED: "live_game_list_failed",
  FIXTURE_LOOKUP_ID_MISSING: "live_game_fixture_lookup_id_missing",
  FIXTURE_LOOKUP_FAILED: "live_game_fixture_lookup_failed",
  ACTIVE_GAMES_LOOKUP_FAILED: "live_game_active_games_lookup_failed",
  TRANSITION_TARGET_NOT_FOUND: "live_game_transition_target_not_found",
  TRANSITION_REJECTED: "live_game_transition_rejected",
  TRANSITION_SAVE_FAILED: "live_game_transition_save_failed",
  STATE_UPDATE_REJECTED: "live_game_state_update_rejected",
  STATE_UPDATE_FAILED: "live_game_state_update_failed",
  PREVIOUS_SNAPSHOT_UNAVAILABLE: "live_game_previous_snapshot_unavailable",
} as const;

export const LiveGameUseCaseMessage = {
  FIXTURE_ID_REQUIRED: "Fixture ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  ALREADY_EXISTS_FOR_FIXTURE: "A live game log already exists for this fixture",
  ID_REQUIRED: "LiveGameLog ID is required",
  NOT_FOUND: "Live game log not found",
  CANNOT_DELETE_IN_PROGRESS: "Cannot delete an in-progress game",
  NEGATIVE_SCORES: "Scores cannot be negative",
  NEGATIVE_MINUTE: "Current minute cannot be negative",
  CAN_ONLY_PAUSE_IN_PROGRESS: "Can only pause an in-progress game",
  CAN_ONLY_RESUME_PAUSED: "Can only resume a paused game",
} as const;

export function build_cannot_start_message(status: GameStatusValue): string {
  return `Cannot start a game that is ${status}`;
}

export function build_cannot_end_message(status: GameStatusValue): string {
  return `Cannot end a game that is ${status}`;
}

export function build_cannot_abandon_message(status: GameStatusValue): string {
  return `Cannot abandon a game that is already ${status}`;
}
