import { describe, it, expect } from "vitest";
import {
  build_leaderboard_entries,
  get_tier_badge_classes,
  get_score_bar_width,
  type OfficialLeaderboardEntry,
} from "./officialLeaderboardLogic";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";

function make_rating(
  overrides: Partial<OfficialPerformanceRating> = {},
): OfficialPerformanceRating {
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
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function make_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fix_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_id: "stage_1",
    home_team_id: "team_a",
    away_team_id: "team_b",
    scheduled_date: "2026-01-01",
    scheduled_time: "15:00",
    status: "completed",
    match_day: 1,
    manual_importance_override: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}

function make_stage(overrides: Partial<CompetitionStage> = {}): CompetitionStage {
  return {
    id: "stage_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    stage_name: "League Phase",
    stage_type: "league_stage",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as CompetitionStage;
}

describe("build_leaderboard_entries", () => {
  it("returns empty array when there are no ratings", () => {
    const result = build_leaderboard_entries([], [], [], new Map());
    expect(result).toHaveLength(0);
  });

  it("builds one entry for a single official with one rating", () => {
    const rating = make_rating({
      overall: 8,
      decision_accuracy: 8,
      game_control: 8,
      communication: 8,
      fitness: 8,
    });
    const fixture = make_fixture();
    const stage = make_stage();
    const name_map = new Map([["off_1", "Jane Smith"]]);

    const entries = build_leaderboard_entries([rating], [fixture], [stage], name_map);

    expect(entries).toHaveLength(1);
    expect(entries[0].official_id).toBe("off_1");
    expect(entries[0].official_name).toBe("Jane Smith");
    expect(entries[0].rating_count).toBe(1);
    expect(entries[0].composite_score).toBeCloseTo(8, 1);
  });

  it("assigns correct tier based on composite score", () => {
    const rating = make_rating({
      overall: 9,
      decision_accuracy: 9,
      game_control: 9,
      communication: 9,
      fitness: 9,
    });
    const fixture = make_fixture();
    const stage = make_stage();
    const name_map = new Map([["off_1", "Elite Official"]]);

    const entries = build_leaderboard_entries([rating], [fixture], [stage], name_map);

    expect(entries[0].tier).toBe("elite");
  });

  it("sorts entries descending by composite_score", () => {
    const high_rating = make_rating({ id: "opr_a", official_id: "off_a", fixture_id: "fix_1", overall: 9, decision_accuracy: 9, game_control: 9, communication: 9, fitness: 9 });
    const low_rating = make_rating({ id: "opr_b", official_id: "off_b", fixture_id: "fix_1", overall: 4, decision_accuracy: 4, game_control: 4, communication: 4, fitness: 4 });
    const fixture = make_fixture();
    const stage = make_stage();
    const name_map = new Map([["off_a", "High Scorer"], ["off_b", "Low Scorer"]]);

    const entries = build_leaderboard_entries(
      [low_rating, high_rating],
      [fixture],
      [stage],
      name_map,
    );

    expect(entries[0].official_id).toBe("off_a");
    expect(entries[1].official_id).toBe("off_b");
  });

  it("applies manual_importance_override from fixture", () => {
    const high_weight_fixture = make_fixture({ id: "fix_2", manual_importance_override: 3.0 });
    const low_weight_fixture = make_fixture({ id: "fix_1", manual_importance_override: 1.0 });

    const official_a_low_fixture_rating = make_rating({
      id: "opr_a",
      official_id: "off_a",
      fixture_id: "fix_1",
      overall: 5, decision_accuracy: 5, game_control: 5, communication: 5, fitness: 5,
    });
    const official_a_high_fixture_rating = make_rating({
      id: "opr_b",
      official_id: "off_a",
      fixture_id: "fix_2",
      overall: 9, decision_accuracy: 9, game_control: 9, communication: 9, fitness: 9,
    });

    const stage = make_stage();
    const name_map = new Map([["off_a", "Jane"]]);

    const entries = build_leaderboard_entries(
      [official_a_low_fixture_rating, official_a_high_fixture_rating],
      [low_weight_fixture, high_weight_fixture],
      [stage],
      name_map,
    );

    expect(entries[0].composite_score).toBeGreaterThan(7);
  });

  it("uses Unknown as official_name when id not in name_map", () => {
    const rating = make_rating();
    const fixture = make_fixture();
    const stage = make_stage();

    const entries = build_leaderboard_entries([rating], [fixture], [stage], new Map());

    expect(entries[0].official_name).toBe("Unknown");
  });

  it("aggregates multiple ratings for the same official", () => {
    const rating_a = make_rating({ id: "opr_a", rater_user_id: "user_1", overall: 6, decision_accuracy: 6, game_control: 6, communication: 6, fitness: 6 });
    const rating_b = make_rating({ id: "opr_b", rater_user_id: "user_2", overall: 8, decision_accuracy: 8, game_control: 8, communication: 8, fitness: 8 });
    const fixture = make_fixture();
    const stage = make_stage();
    const name_map = new Map([["off_1", "Multi-rated Official"]]);

    const entries = build_leaderboard_entries(
      [rating_a, rating_b],
      [fixture],
      [stage],
      name_map,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].rating_count).toBe(2);
    expect(entries[0].composite_score).toBeCloseTo(7, 1);
  });
});

describe("get_tier_badge_classes", () => {
  it("returns a non-empty string for each tier", () => {
    expect(get_tier_badge_classes("elite").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("strong").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("adequate").length).toBeGreaterThan(0);
    expect(get_tier_badge_classes("needs_development").length).toBeGreaterThan(0);
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
