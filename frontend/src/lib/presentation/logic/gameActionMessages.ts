export const GAME_ACTION_USER_MESSAGE = {
  START_GAME_FAILED:
    "We couldn't start the game. Please check your connection and try again.",
  END_GAME_FAILED: "We couldn't end the game. Please try again.",
  CHANGE_PERIOD_FAILED:
    "We couldn't move to the next period. Please try again.",
  END_PERIOD_FAILED: "We couldn't end this period. Please try again.",
  RECORD_EVENT_FAILED: "We couldn't save that event. Please try again.",
  EXTRA_TIME_FAILED: "We couldn't add extra time. Please try again.",
  RELOAD_AFTER_LINEUPS_FAILED:
    "Lineups were generated, but the game could not be refreshed. Please reload the page.",
} as const;

export const GAME_ACTION_EVENT = {
  START_GAME_FAILED: "game_start_failed",
  END_GAME_FAILED: "game_end_failed",
  END_GAME_EVENT_RECORD_FAILED: "game_end_event_record_failed",
  CHANGE_PERIOD_FAILED: "game_period_change_failed",
  END_PERIOD_FAILED: "game_period_end_failed",
  END_PERIOD_UPDATE_FAILED: "game_period_end_update_failed",
  FIRST_PERIOD_UPDATE_FAILED: "game_first_period_update_failed",
  RECORD_EVENT_FAILED: "game_event_record_failed",
  EXTRA_TIME_FAILED: "game_extra_time_record_failed",
  RELOAD_AFTER_LINEUPS_FAILED: "game_reload_after_lineups_failed",
} as const;

type GameActionEvent =
  (typeof GAME_ACTION_EVENT)[keyof typeof GAME_ACTION_EVENT];

type GameActionFailure = { success: false; error_message: string };

export function build_game_action_failure(command: {
  event: GameActionEvent;
  fixture_id: string;
  technical_error: string;
  user_message: string;
}): GameActionFailure {
  console.error("[GameAction] Game action failed", {
    event: command.event,
    fixture_id: command.fixture_id,
    error: command.technical_error,
  });
  return { success: false, error_message: command.user_message };
}
