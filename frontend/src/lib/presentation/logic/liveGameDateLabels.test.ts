import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { format_fixture_date } from "./dashboardPageDisplayLogic";
import { build_entity_display_label } from "./entityDisplayFormatter";
import { format_fixture_date_time } from "./fixtureLineupCreateState";
import { format_fixture_scheduled_date_label } from "./liveGameStartConfirmation";

const ORIGINAL_TIME_ZONE = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/Los_Angeles";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TIME_ZONE;
});

describe("fixture date labels in a timezone behind UTC", () => {
  it("shows the scheduled calendar day in the start confirmation", () => {
    expect(format_fixture_scheduled_date_label("2024-03-14")).toContain("14");
    expect(format_fixture_scheduled_date_label("2024-03-14")).toContain(
      "Thursday",
    );
  });

  it("returns the original text when the date cannot be read", () => {
    expect(format_fixture_scheduled_date_label("next week")).toBe("next week");
  });

  it("shows the scheduled calendar day in the lineup fixture label", () => {
    expect(format_fixture_date_time("2024-03-14", "15:00")).toBe(
      "14 Mar 2024 - 15:00",
    );
  });

  it("shows the scheduled calendar day in generic fixture labels", () => {
    const entity = {
      id: "f1",
      home_team_id: "t1",
      away_team_id: "t2",
      home_team_name: "Lions FC",
      away_team_name: "Tigers FC",
      scheduled_date: "2025-04-03",
      scheduled_time: "14:00",
    } as unknown as BaseEntity;
    expect(build_entity_display_label(entity)).toContain("3 Apr 2025");
  });

  it("recognises today's fixture on the dashboard by local calendar day", () => {
    const today = new Date();
    const today_key = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    expect(format_fixture_date(today_key, "10:00")).toBe("Today, 10:00");
  });
});
