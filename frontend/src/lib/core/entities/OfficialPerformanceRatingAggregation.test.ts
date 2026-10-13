import { describe, expect, it } from "vitest";

import {
  aggregate_weighted_ratings,
  type OfficialPerformanceRating,
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

describe("aggregate_weighted_ratings", () => {
  it("returns empty status for empty array", () => {
    expect(aggregate_weighted_ratings([])).toEqual({ status: "empty" });
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
    const aggregation_result = aggregate_weighted_ratings([rating]);

    expect(aggregation_result).toMatchObject({ status: "present" });

    if (aggregation_result.status !== "present") {
      expect(aggregation_result.status).toBe("present");
      return;
    }

    expect(aggregation_result.summary.total_weighted_score).toBeCloseTo(8, 5);
    expect(aggregation_result.summary.rating_count).toBe(1);
    expect(aggregation_result.summary.official_id).toBe("off_1");
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

    const aggregation_result = aggregate_weighted_ratings([
      low_importance_rating,
      high_importance_rating,
    ]);

    expect(aggregation_result).toMatchObject({ status: "present" });

    if (aggregation_result.status !== "present") {
      expect(aggregation_result.status).toBe("present");
      return;
    }

    expect(aggregation_result.summary.total_weighted_score).toBeGreaterThan(
      6.5,
    );
  });

  it("returns finite total_weighted_score when total_weight is zero", () => {
    const rating = make_rating({ importance_weight: 0 });
    const aggregation_result = aggregate_weighted_ratings([rating]);

    expect(aggregation_result).toMatchObject({ status: "present" });

    if (aggregation_result.status !== "present") {
      expect(aggregation_result.status).toBe("present");
      return;
    }

    expect(isFinite(aggregation_result.summary.total_weighted_score)).toBe(
      true,
    );
  });
});
