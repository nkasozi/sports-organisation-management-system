import { describe, expect, it } from "vitest";

import {
  compute_composite_score,
  create_empty_rating_input,
  get_performance_tier,
  get_tier_label,
  type RatingDimensions,
} from "./OfficialPerformanceRating";

describe("get_performance_tier", () => {
  it("returns elite at exactly 8.5", () => {
    expect(get_performance_tier(8.5)).toBe("elite");
  });

  it("returns elite above 8.5", () => {
    expect(get_performance_tier(9.9)).toBe("elite");
  });

  it("returns strong at exactly 7.0", () => {
    expect(get_performance_tier(7.0)).toBe("strong");
  });

  it("returns strong just below elite threshold", () => {
    expect(get_performance_tier(8.49)).toBe("strong");
  });

  it("returns adequate at exactly 5.5", () => {
    expect(get_performance_tier(5.5)).toBe("adequate");
  });

  it("returns adequate just below strong threshold", () => {
    expect(get_performance_tier(6.9)).toBe("adequate");
  });

  it("returns needs_development just below adequate threshold", () => {
    expect(get_performance_tier(5.49)).toBe("needs_development");
  });

  it("returns needs_development at zero", () => {
    expect(get_performance_tier(0)).toBe("needs_development");
  });
});

describe("get_tier_label", () => {
  it("returns correct label for each tier", () => {
    expect(get_tier_label("elite")).toBe("Elite");
    expect(get_tier_label("strong")).toBe("Strong");
    expect(get_tier_label("adequate")).toBe("Adequate");
    expect(get_tier_label("needs_development")).toBe("Needs Development");
  });
});

describe("compute_composite_score", () => {
  it("returns 10 when all dimensions are 10", () => {
    const perfect = {
      overall: 10,
      decision_accuracy: 10,
      game_control: 10,
      communication: 10,
      fitness: 10,
    } as RatingDimensions;
    expect(compute_composite_score(perfect)).toBe(10);
  });

  it("returns 1 when all dimensions are 1", () => {
    const lowest = {
      overall: 1,
      decision_accuracy: 1,
      game_control: 1,
      communication: 1,
      fitness: 1,
    } as RatingDimensions;
    expect(compute_composite_score(lowest)).toBe(1);
  });

  it("returns correct average for mixed dimensions", () => {
    const mixed = {
      overall: 10,
      decision_accuracy: 5,
      game_control: 5,
      communication: 5,
      fitness: 5,
    } as RatingDimensions;
    expect(compute_composite_score(mixed)).toBe(6);
  });
});

describe("create_empty_rating_input", () => {
  it("defaults all numeric dimensions to 5", () => {
    const input = create_empty_rating_input();

    expect(input.overall).toBe(5);
    expect(input.decision_accuracy).toBe(5);
    expect(input.game_control).toBe(5);
    expect(input.communication).toBe(5);
    expect(input.fitness).toBe(5);
  });

  it("uses provided ids when given", () => {
    const input = create_empty_rating_input("org_1", "off_1", "fix_1");

    expect(input.organization_id).toBe("org_1");
    expect(input.official_id).toBe("off_1");
    expect(input.fixture_id).toBe("fix_1");
  });

  it("sets rater_user_id to empty string by default", () => {
    const input = create_empty_rating_input();
    expect(input.rater_user_id).toBe("");
  });

  it("sets rater_role to empty string by default", () => {
    const input = create_empty_rating_input();
    expect(input.rater_role).toBe("");
  });
});
