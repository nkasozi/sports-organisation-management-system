import { describe, expect, it } from "vitest";

import { create_game_event, format_event_time } from "./FixtureGameEvents";

describe("FixtureGameEvents", () => {
  it("creates events with explicit zero stoppage time", () => {
    const game_event = create_game_event("goal", 12, "home");

    expect(game_event.stoppage_time_minute).toBe(0);
  });

  it("formats normal and stoppage time consistently", () => {
    expect(format_event_time(12 as never, 0 as never)).toBe("12'");
    expect(format_event_time(45 as never, 2 as never)).toBe("45+2'");
  });
});
