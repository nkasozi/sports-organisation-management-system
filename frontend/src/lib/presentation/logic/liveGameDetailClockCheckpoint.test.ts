import { describe, expect, it, vi } from "vitest";

import {
  CLOCK_CHECKPOINT_OUTCOME,
  persist_live_game_clock_checkpoint,
} from "./liveGameDetailClockCheckpoint";

const IN_PLAY_FIXTURE = {
  id: "fixture-1",
  status: "in_progress",
  current_period: "first_half",
  current_minute: 10,
} as never;

describe("persist_live_game_clock_checkpoint", () => {
  it("saves the paused clock minute on the fixture", async () => {
    const update_period = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "fixture-1", current_minute: 23 },
    });
    const outcome = await persist_live_game_clock_checkpoint({
      fixture_use_cases: { update_period },
      fixture: IN_PLAY_FIXTURE,
      game_clock_seconds: 23 * 60 + 40,
    });
    expect(update_period).toHaveBeenCalledWith("fixture-1", "first_half", 23);
    expect(outcome).toEqual({
      status: CLOCK_CHECKPOINT_OUTCOME.SAVED,
      current_minute: 23,
    });
  });

  it("skips saving when the clock has not moved past the stored minute", async () => {
    const update_period = vi.fn();
    const outcome = await persist_live_game_clock_checkpoint({
      fixture_use_cases: { update_period },
      fixture: IN_PLAY_FIXTURE,
      game_clock_seconds: 10 * 60,
    });
    expect(update_period).not.toHaveBeenCalled();
    expect(outcome.status).toBe(CLOCK_CHECKPOINT_OUTCOME.SKIPPED);
  });

  it("skips saving when the game is not in play", async () => {
    const update_period = vi.fn();
    const outcome = await persist_live_game_clock_checkpoint({
      fixture_use_cases: { update_period },
      fixture: {
        ...(IN_PLAY_FIXTURE as object),
        current_period: "finished",
      } as never,
      game_clock_seconds: 99 * 60,
    });
    expect(update_period).not.toHaveBeenCalled();
    expect(outcome.status).toBe(CLOCK_CHECKPOINT_OUTCOME.SKIPPED);
  });

  it("logs and reports a failed save", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const outcome = await persist_live_game_clock_checkpoint({
      fixture_use_cases: {
        update_period: vi
          .fn()
          .mockResolvedValue({ success: false, error: "x" }),
      },
      fixture: IN_PLAY_FIXTURE,
      game_clock_seconds: 30 * 60,
    });
    expect(outcome.status).toBe(CLOCK_CHECKPOINT_OUTCOME.FAILED);
    expect(error_spy).toHaveBeenCalledWith(
      "[LiveGameDetail] Clock checkpoint failed",
      expect.objectContaining({ event: "live_game_clock_checkpoint_failed" }),
    );
    error_spy.mockRestore();
  });
});
