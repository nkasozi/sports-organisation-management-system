import { describe, expect, it } from "vitest";

import { restore_live_game_clock_extras } from "./liveGameDetailClockRestore";

const NOW = new Date("2024-06-01T10:05:00.000Z");

describe("restore_live_game_clock_extras", () => {
  it("restores added time and the running break of a game in progress", () => {
    expect(
      restore_live_game_clock_extras({
        fixture: {
          status: "in_progress",
          clock_added_seconds: 180,
          clock_break_started_at: "2024-06-01T10:00:00.000Z",
        } as never,
        now: NOW,
      }),
    ).toEqual({ extra_time_added_seconds: 180, break_elapsed_seconds: 300 });
  });

  it("starts from zero when nothing was saved", () => {
    expect(
      restore_live_game_clock_extras({
        fixture: { status: "in_progress" } as never,
        now: NOW,
      }),
    ).toEqual({ extra_time_added_seconds: 0, break_elapsed_seconds: 0 });
  });

  it("ignores saved values once the game is no longer in progress", () => {
    expect(
      restore_live_game_clock_extras({
        fixture: {
          status: "completed",
          clock_added_seconds: 180,
          clock_break_started_at: "2024-06-01T10:00:00.000Z",
        } as never,
        now: NOW,
      }),
    ).toEqual({ extra_time_added_seconds: 0, break_elapsed_seconds: 0 });
  });
});
