import { describe, expect, it } from "vitest";

import { advance_live_clock } from "./liveGameClockProgress";

const SYNCED_AT = new Date("2024-06-01T10:00:00.000Z").getTime();
const COUNTERS = { game_clock_seconds: 100, break_elapsed_seconds: 5 };

describe("advance_live_clock", () => {
  it("adds every whole second that passed on the wall clock", () => {
    expect(
      advance_live_clock(
        COUNTERS,
        true,
        SYNCED_AT,
        new Date(SYNCED_AT + 30_400),
      ),
    ).toEqual({
      counters: { game_clock_seconds: 130, break_elapsed_seconds: 5 },
      synced_at_milliseconds: SYNCED_AT + 30_000,
    });
  });

  it("adds elapsed time to the break counter between periods", () => {
    expect(
      advance_live_clock(
        COUNTERS,
        false,
        SYNCED_AT,
        new Date(SYNCED_AT + 2_000),
      ).counters,
    ).toEqual({ game_clock_seconds: 100, break_elapsed_seconds: 7 });
  });

  it("keeps the counters when less than a second passed or the clock went backwards", () => {
    expect(
      advance_live_clock(COUNTERS, true, SYNCED_AT, new Date(SYNCED_AT + 999)),
    ).toEqual({ counters: COUNTERS, synced_at_milliseconds: SYNCED_AT });
    expect(
      advance_live_clock(COUNTERS, true, SYNCED_AT, new Date(SYNCED_AT - 5_000))
        .counters,
    ).toEqual(COUNTERS);
  });
});
