import { describe, expect, it } from "vitest";

import { PLAYER_TIME_ON } from "$lib/core/entities/FixtureLineup";

import { get_time_on_short_label } from "./liveGameLineupConstants";

describe("get_time_on_short_label", () => {
  it("abbreviates the special time-on values", () => {
    expect(
      get_time_on_short_label({
        value: PLAYER_TIME_ON.PRESENT_AT_START,
        label: "Present at Start",
      }),
    ).toBe("X");
    expect(
      get_time_on_short_label({
        value: PLAYER_TIME_ON.DIDNT_PLAY,
        label: "Didn't Play",
      }),
    ).toBe("-");
  });

  it("keeps minute labels", () => {
    expect(get_time_on_short_label({ value: "12", label: "12'" })).toBe("12'");
  });
});
