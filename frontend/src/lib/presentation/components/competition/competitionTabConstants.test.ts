import { describe, expect, it } from "vitest";

import { COMPETITION_DERIVED_STATUS } from "$lib/core/entities/CompetitionTypes";

import { get_competition_status_badge_tone_classes } from "./competitionTabConstants";

describe("get_competition_status_badge_tone_classes", () => {
  it("adds the tone for known statuses", () => {
    expect(
      get_competition_status_badge_tone_classes(
        COMPETITION_DERIVED_STATUS.ACTIVE,
      ),
    ).toContain("bg-green-100");
    expect(get_competition_status_badge_tone_classes("cancelled")).toContain(
      "bg-red-100",
    );
  });

  it("has no tone for unknown statuses", () => {
    expect(get_competition_status_badge_tone_classes("archived")).toBe("");
  });
});
