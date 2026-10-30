import { describe, expect, it } from "vitest";

import {
  build_audience_display,
  summarize_viewer_stats,
} from "./liveAudienceDisplay";

const CRANE = { name: "Anonymous Crane", color_index: 2 };
const LION = { name: "Anonymous Lion", color_index: 5 };

describe("the live audience bar", () => {
  it("tells a lone viewer they are the only one watching", () => {
    const display = build_audience_display({
      watching_now: 1,
      is_viewer_counted: true,
      other_faces: [],
    });

    expect(display.headline).toBe("Only you are watching");
    expect(display.faces.map((face) => face.name)).toEqual(["You"]);
  });

  it("shows you first, then anonymous faces, then how many more", () => {
    const display = build_audience_display({
      watching_now: 23,
      is_viewer_counted: true,
      other_faces: [CRANE, LION],
    });

    expect(display.headline).toBe("23 people watching now");
    expect(display.faces.map((face) => face.initial)).toEqual([
      "You",
      "C",
      "L",
    ]);
    expect(display.hidden_count).toBe(20);
  });

  it("waits quietly until the first count arrives", () => {
    expect(
      build_audience_display({
        watching_now: 0,
        is_viewer_counted: false,
        other_faces: [],
      }).headline,
    ).toBe("Connecting to the live audience…");
  });
});

describe("the saved live audience stats", () => {
  it("describes followers, the busiest moment and the total watch time", () => {
    expect(
      summarize_viewer_stats({
        status: "present",
        unique_viewers: 148,
        peak_viewers: 61,
        total_watch_minutes: 1_505,
      }),
    ).toEqual({
      followed_live: "148 people followed live",
      peak: "61 watching at the busiest moment",
      watch_time: "25 h 5 min watched in total",
    });
  });

  it("speaks naturally about a single follower", () => {
    expect(
      summarize_viewer_stats({
        status: "present",
        unique_viewers: 1,
        peak_viewers: 1,
        total_watch_minutes: 42,
      }),
    ).toMatchObject({
      followed_live: "1 person followed live",
      watch_time: "42 min watched in total",
    });
  });
});
