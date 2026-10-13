import { afterEach, describe, expect, it, vi } from "vitest";

import {
  build_game_action_failure,
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";

describe("build_game_action_failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a structured error and returns only the friendly message", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const failure = build_game_action_failure({
      event: GAME_ACTION_EVENT.START_GAME_FAILED,
      fixture_id: "fixture-1",
      technical_error: "network timeout",
      user_message: GAME_ACTION_USER_MESSAGE.START_GAME_FAILED,
    });

    expect(failure).toEqual({
      success: false,
      error_message: GAME_ACTION_USER_MESSAGE.START_GAME_FAILED,
    });
    expect(failure.error_message).not.toContain("network timeout");
    expect(error_spy).toHaveBeenCalledWith("[GameAction] Game action failed", {
      event: "game_start_failed",
      fixture_id: "fixture-1",
      error: "network timeout",
    });
  });
});
