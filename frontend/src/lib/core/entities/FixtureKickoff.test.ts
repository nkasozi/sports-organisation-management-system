import { describe, expect, it } from "vitest";

import { build_fixture_kickoff_date_time } from "./FixtureKickoff";

describe("build_fixture_kickoff_date_time", () => {
  it("combines the scheduled date and time as local kick-off time", () => {
    const kickoff = build_fixture_kickoff_date_time({
      scheduled_date: "2026-10-13",
      scheduled_time: "07:00",
    });

    expect(kickoff).toBe("2026-10-13T07:00");
    expect(new Date(kickoff).getHours()).toBe(7);
  });

  it("keeps a date that already carries a time", () => {
    expect(
      build_fixture_kickoff_date_time({
        scheduled_date: "2026-04-06T15:00:00",
        scheduled_time: "15:00",
      }),
    ).toBe("2026-04-06T15:00:00");
  });

  it("falls back to the start of the day when no time is scheduled", () => {
    expect(
      build_fixture_kickoff_date_time({
        scheduled_date: "2026-10-13",
        scheduled_time: "",
      }),
    ).toBe("2026-10-13T00:00");
  });
});
