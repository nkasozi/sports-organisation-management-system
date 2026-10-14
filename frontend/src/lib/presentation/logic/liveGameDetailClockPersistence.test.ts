import { describe, expect, it, type Mock, vi } from "vitest";

import {
  CLOCK_PERSIST_OUTCOME,
  type ClockPersistCommand,
  persist_live_game_clock_state,
  should_resume_live_game_clock_on_load,
} from "./liveGameDetailClockPersistence";

const NOW = new Date("2024-06-01T10:00:00.000Z");
const IN_PROGRESS_FIXTURE = {
  id: "fixture-1",
  status: "in_progress",
  current_period: "first_half",
} as never;

function create_use_cases(result: object): {
  save_clock_snapshot: Mock<
    ClockPersistCommand["fixture_use_cases"]["save_clock_snapshot"]
  >;
} {
  return {
    save_clock_snapshot: vi
      .fn<ClockPersistCommand["fixture_use_cases"]["save_clock_snapshot"]>()
      .mockResolvedValue(result as never),
  };
}

const NO_EXTRAS = { break_elapsed_seconds: 0, extra_time_added_seconds: 0 };

describe("persist_live_game_clock_state", () => {
  it("saves a running clock while a playing period is under way", async () => {
    const fixture_use_cases = create_use_cases({ success: true, data: {} });
    const outcome = await persist_live_game_clock_state({
      fixture_use_cases,
      fixture: IN_PROGRESS_FIXTURE,
      game_clock_seconds: 754,
      is_clock_running: true,
      is_current_period_playing: true,
      now: NOW,
      ...NO_EXTRAS,
    });
    expect(outcome).toEqual({ status: CLOCK_PERSIST_OUTCOME.SAVED });
    expect(fixture_use_cases.save_clock_snapshot).toHaveBeenCalledWith(
      "fixture-1",
      {
        game_clock: {
          status: "running",
          elapsed_seconds: 754,
          started_at: "2024-06-01T10:00:00.000Z",
        },
        added_seconds: 0,
        break_clock: { status: "not_on_break" },
      },
    );
  });

  it("saves a stopped game clock and the running break during a break", async () => {
    const fixture_use_cases = create_use_cases({ success: true, data: {} });
    await persist_live_game_clock_state({
      fixture_use_cases,
      fixture: IN_PROGRESS_FIXTURE,
      game_clock_seconds: 2700,
      is_clock_running: true,
      is_current_period_playing: false,
      now: NOW,
      break_elapsed_seconds: 90,
      extra_time_added_seconds: 60,
    });
    expect(fixture_use_cases.save_clock_snapshot).toHaveBeenCalledWith(
      "fixture-1",
      {
        game_clock: { status: "stopped", elapsed_seconds: 2700 },
        added_seconds: 60,
        break_clock: {
          status: "on_break",
          started_at: "2024-06-01T09:58:30.000Z",
        },
      },
    );
  });

  it("skips saving for games that are not in progress", async () => {
    const fixture_use_cases = create_use_cases({ success: true, data: {} });
    const outcome = await persist_live_game_clock_state({
      fixture_use_cases,
      fixture: { id: "fixture-1", status: "completed" } as never,
      game_clock_seconds: 5400,
      is_clock_running: false,
      is_current_period_playing: false,
      now: NOW,
      ...NO_EXTRAS,
    });
    expect(outcome).toEqual({ status: CLOCK_PERSIST_OUTCOME.SKIPPED });
    expect(fixture_use_cases.save_clock_snapshot).not.toHaveBeenCalled();
  });

  it("reports a failure when the clock cannot be saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const outcome = await persist_live_game_clock_state({
      fixture_use_cases: create_use_cases({ success: false, error: "offline" }),
      fixture: IN_PROGRESS_FIXTURE,
      game_clock_seconds: 10,
      is_clock_running: false,
      is_current_period_playing: true,
      now: NOW,
      ...NO_EXTRAS,
    });
    expect(outcome).toEqual({ status: CLOCK_PERSIST_OUTCOME.FAILED });
  });
});

describe("should_resume_live_game_clock_on_load", () => {
  it("resumes a running clock and older games without saved clock state", () => {
    expect(
      should_resume_live_game_clock_on_load(
        {
          ...(IN_PROGRESS_FIXTURE as object),
          clock_status: "running",
          clock_elapsed_seconds: 5,
          clock_started_at: NOW.toISOString(),
        } as never,
        true,
      ),
    ).toBe(true);
    expect(
      should_resume_live_game_clock_on_load(IN_PROGRESS_FIXTURE, true),
    ).toBe(true);
  });

  it("keeps a paused clock paused but still runs the break timer", () => {
    const paused_fixture = {
      ...(IN_PROGRESS_FIXTURE as object),
      clock_status: "stopped",
      clock_elapsed_seconds: 5,
    } as never;
    expect(should_resume_live_game_clock_on_load(paused_fixture, true)).toBe(
      false,
    );
    expect(should_resume_live_game_clock_on_load(paused_fixture, false)).toBe(
      true,
    );
  });

  it("does not resume games that are not in progress", () => {
    expect(
      should_resume_live_game_clock_on_load(
        { status: "completed" } as never,
        true,
      ),
    ).toBe(false);
  });
});
