import { describe, expect, it } from "vitest";

import { restore_live_game_clock_seconds } from "./liveGameDetailClockRestore";

const PLAYING_PERIODS = [
  {
    id: "first_half",
    name: "First Half",
    duration_minutes: 45,
    is_break: false,
  },
  {
    id: "second_half",
    name: "Second Half",
    duration_minutes: 45,
    is_break: false,
  },
] as never;

const NOW = new Date("2024-06-01T10:10:00.000Z");

describe("restore_live_game_clock_seconds", () => {
  it("restores from the persisted clock minute while in progress", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "first_half",
          current_minute: 30,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(1800);
  });

  it("never restores earlier than the start of the current period", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "second_half",
          current_minute: 12,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(2700);
  });

  it("starts at zero for fixtures that are not in progress", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "scheduled",
          current_period: "pre_game",
          current_minute: 50,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(0);
  });

  it("treats a missing persisted minute as the period start", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "first_half",
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(0);
  });

  it("keeps the persisted clock during a break between periods", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "half_time",
          current_minute: 45,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(2700);
  });

  it("restores a running clock to the exact second including time since it started", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "first_half",
          current_minute: 2,
          clock_status: "running",
          clock_elapsed_seconds: 125,
          clock_started_at: "2024-06-01T10:05:00.000Z",
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(425);
  });

  it("restores a stopped clock to the exact second it was paused", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "in_progress",
          current_period: "first_half",
          current_minute: 2,
          clock_status: "stopped",
          clock_elapsed_seconds: 149,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(149);
  });

  it("ignores saved clock state for fixtures that are not in progress", () => {
    expect(
      restore_live_game_clock_seconds({
        fixture: {
          status: "completed",
          current_period: "finished",
          clock_status: "stopped",
          clock_elapsed_seconds: 5400,
        } as never,
        playing_periods: PLAYING_PERIODS,
        now: NOW,
      }),
    ).toBe(0);
  });
});
