import { describe, expect, it } from "vitest";

import {
  build_moment_timing_label,
  build_moment_timing_rank,
} from "./competitionResultsPlayerMoments";

const PERIOD_NAMES = new Map([
  ["first_quarter", { name: "1st Quarter", order: 1 }],
  ["second_quarter", { name: "2nd Quarter", order: 3 }],
]);

describe("build_moment_timing_label", () => {
  it("shows the minute, with stoppage time when there is any", () => {
    expect(
      build_moment_timing_label(
        { minute: 12, stoppage_time_minute: 0, period_id: "second_quarter" },
        PERIOD_NAMES,
      ),
    ).toBe("12'");
    expect(
      build_moment_timing_label(
        { minute: 45, stoppage_time_minute: 2 },
        PERIOD_NAMES,
      ),
    ).toBe("45+2'");
  });

  it("falls back to the period name when no minute was recorded", () => {
    expect(
      build_moment_timing_label(
        { minute: 0, stoppage_time_minute: 0, period_id: "second_quarter" },
        PERIOD_NAMES,
      ),
    ).toBe("2nd Quarter");
  });

  it("is blank when neither a minute nor a known period was recorded", () => {
    expect(
      build_moment_timing_label(
        { minute: 0, stoppage_time_minute: 0 },
        PERIOD_NAMES,
      ),
    ).toBe("");
  });
});

describe("build_moment_timing_rank", () => {
  it("orders by period first, then minute and stoppage time", () => {
    const ranks = [
      { minute: 0, stoppage_time_minute: 0, period_id: "second_quarter" },
      { minute: 12, stoppage_time_minute: 0, period_id: "first_quarter" },
      { minute: 45, stoppage_time_minute: 2 },
      { minute: 45, stoppage_time_minute: 0 },
      { minute: 3, stoppage_time_minute: 0, period_id: "second_quarter" },
    ].map((timing) => build_moment_timing_rank(timing, PERIOD_NAMES));

    expect(ranks[1]).toBeLessThan(ranks[0]);
    expect(ranks[0]).toBeLessThan(ranks[4]);
    expect(ranks[3]).toBeLessThan(ranks[2]);
  });
});
