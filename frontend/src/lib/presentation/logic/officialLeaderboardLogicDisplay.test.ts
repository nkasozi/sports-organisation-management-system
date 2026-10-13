import { describe, expect, it } from "vitest";

import {
  get_score_bar_width,
  get_tier_badge_classes,
} from "./officialLeaderboardLogic";

describe("get_tier_badge_classes", () => {
  it("returns a non-empty string for each tier", () => {
    expect(get_tier_badge_classes("elite").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("strong").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("adequate").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("needs_development").length).toBeGreaterThan(
      0,
    );
  });

  it("returns different classes for different tiers", () => {
    const elite = get_tier_badge_classes("elite");
    const needs = get_tier_badge_classes("needs_development");
    expect(elite).not.toBe(needs);
  });
});

describe("get_score_bar_width", () => {
  it("returns 0% for score 0", () => {
    expect(get_score_bar_width(0)).toBe("0%");
  });

  it("returns 100% for score 10", () => {
    expect(get_score_bar_width(10)).toBe("100%");
  });

  it("returns 50% for score 5", () => {
    expect(get_score_bar_width(5)).toBe("50%");
  });

  it("clamps to 0% for negative scores", () => {
    expect(get_score_bar_width(-5)).toBe("0%");
  });

  it("clamps to 100% for scores above 10", () => {
    expect(get_score_bar_width(15)).toBe("100%");
  });
});
