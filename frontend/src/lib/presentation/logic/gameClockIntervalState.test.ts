import { describe, expect, it, vi } from "vitest";

import {
  clear_game_clock_interval,
  create_stopped_game_clock_interval_state,
  GAME_CLOCK_INTERVAL_STATUS,
  type GameClockIntervalState,
  is_game_clock_interval_running,
} from "./gameClockIntervalState";

describe("gameClockIntervalState", () => {
  it("starts stopped", () => {
    const state = create_stopped_game_clock_interval_state();
    expect(state.status).toBe(GAME_CLOCK_INTERVAL_STATUS.STOPPED);
    expect(is_game_clock_interval_running(state)).toBe(false);
  });

  it("clears a running interval and returns the stopped state", () => {
    const clear_interval_spy = vi
      .spyOn(globalThis, "clearInterval")
      .mockImplementation(() => {});
    const interval_id = 7 as unknown as ReturnType<typeof setInterval>;
    const running_state: GameClockIntervalState = {
      status: GAME_CLOCK_INTERVAL_STATUS.RUNNING,
      interval_id,
    };
    expect(is_game_clock_interval_running(running_state)).toBe(true);
    const cleared = clear_game_clock_interval(running_state);
    expect(clear_interval_spy).toHaveBeenCalledWith(interval_id);
    expect(cleared.status).toBe(GAME_CLOCK_INTERVAL_STATUS.STOPPED);
    clear_interval_spy.mockRestore();
  });

  it("leaves a stopped interval untouched", () => {
    const stopped = create_stopped_game_clock_interval_state();
    expect(clear_game_clock_interval(stopped)).toBe(stopped);
  });
});
