import { describe, expect, it } from "vitest";

import {
  aggregate_weighted_ratings,
  compute_composite_score,
  create_empty_rating_input,
  get_performance_tier,
  get_tier_label,
  type OfficialPerformanceRating,
  type RatingDimensions,
  validate_rating_input,
} from "./OfficialPerformanceRating";

function make_rating(
  overrides: Partial<
    OfficialPerformanceRating & { importance_weight: number }
  > = {},
): OfficialPerformanceRating & { importance_weight: number } {
  return {
    id: "opr_001",
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    submitted_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    importance_weight: 1.0,
    ...overrides,
  } as OfficialPerformanceRating & { importance_weight: number };
}

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
    const perfect =  {
      overall: 10,
      decision_accuracy: 10,
      game_control: 10,
      communication: 10,
      fitness: 10,
    } as RatingDimensions;
    expect(compute_composite_score(perfect)).toBe(10);
  });

  it("returns 1 when all dimensions are 1", () => {
    const lowest =  {
      overall: 1,
      decision_accuracy: 1,
      game_control: 1,
      communication: 1,
      fitness: 1,
    } as RatingDimensions;
    expect(compute_composite_score(lowest)).toBe(1);
  });

  it("returns correct average for mixed dimensions", () => {
    const mixed =  {
      overall: 10,
      decision_accuracy: 5,
      game_control: 5,
      communication: 5,
      fitness: 5,
    } as RatingDimensions;
    expect(compute_composite_score(mixed)).toBe(6);
  });
});

describe("aggregate_weighted_ratings", () => {
  it("returns null for empty array", () => {
    expect(aggregate_weighted_ratings([])).toBeNull();
  });

  it("returns correct summary for single uniform rating with weight 1", () => {
    const rating = make_rating({
      overall: 8,
      decision_accuracy: 8,
      game_control: 8,
      communication: 8,
      fitness: 8,
      importance_weight: 1.0,
    });
    const summary = aggregate_weighted_ratings([rating]);

    expect(summary).not.toBeNull();
    expect(summary!.total_weighted_score).toBeCloseTo(8, 5);
    expect(summary!.rating_count).toBe(1);
    expect(summary!.official_id).toBe("off_1");
  });

  it("weights high-importance fixture more heavily in composite score", () => {
    const low_importance_rating = make_rating({
      overall: 4,
      decision_accuracy: 4,
      game_control: 4,
      communication: 4,
      fitness: 4,
      importance_weight: 1.0,
    });
    const high_importance_rating = make_rating({
      overall: 9,
      decision_accuracy: 9,
      game_control: 9,
      communication: 9,
      fitness: 9,
      importance_weight: 3.0,
    });

    const summary = aggregate_weighted_ratings([
      low_importance_rating,
      high_importance_rating,
    ]);

    expect(summary).not.toBeNull();
    expect(summary!.total_weighted_score).toBeGreaterThan(6.5);
  });

  it("returns null total_weighted_score-safe when total_weight is zero", () => {
    const rating = make_rating({ importance_weight: 0 });
    const summary = aggregate_weighted_ratings([rating]);
    expect(summary).not.toBeNull();
    expect(isFinite(summary!.total_weighted_score)).toBe(true);
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

describe("validate_rating_input", () => {
  function valid_input() {
    return create_empty_rating_input("org_1", "off_1", "fix_1");
  }

  it("passes for a fully valid input", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
    });
    expect(errors).toHaveLength(0);
  });

  it("requires official_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      official_id: "",
    });
    expect(errors).toContain("Official is required");
  });

  it("requires fixture_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      fixture_id: "",
    });
    expect(errors).toContain("Fixture is required");
  });

  it("requires rater_user_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "",
    });
    expect(errors).toContain("Rater user is required");
  });

  it("rejects dimension below 1", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      overall: 0,
    });
    expect(errors.some((e) => e.includes("overall"))).toBe(true);
  });

  it("rejects dimension above 10", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      fitness: 11,
    });
    expect(errors.some((e) => e.includes("fitness"))).toBe(true);
  });

  it("rejects non-number dimension", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      decision_accuracy: NaN,
    });
    expect(errors.some((e) => e.includes("decision_accuracy"))).toBe(true);
  });

  it("collects multiple errors at once", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      official_id: "",
      fixture_id: "",
      rater_user_id: "",
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
