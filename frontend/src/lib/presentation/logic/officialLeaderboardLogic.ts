import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import {
  aggregate_weighted_ratings,
  get_performance_tier,
  type WeightedOfficialSummary,
  type PerformanceTier,
} from "$lib/core/entities/OfficialPerformanceRating";
import type { Official } from "$lib/core/entities/Official";
import { get_official_full_name } from "$lib/core/entities/Official";
import type { Fixture } from "$lib/core/entities/Fixture";
import {
  compute_importance_weight,
  type ImportanceWeightInput,
} from "$lib/core/services/compute_importance_weight";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";

export interface OfficialLeaderboardEntry {
  official_id: string;
  official_name: string;
  rating_count: number;
  composite_score: number;
  tier: PerformanceTier;
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
}

function build_fixture_weight_map(
  fixtures: Fixture[],
  stages: CompetitionStage[],
): Map<string, number> {
  const stage_by_id = new Map(stages.map((s) => [s.id, s]));
  const weight_map = new Map<string, number>();

  for (const fixture of fixtures) {
    const stage = fixture.stage_id ? stage_by_id.get(fixture.stage_id) : null;

    const weight_input: ImportanceWeightInput = {
      stage_type: stage?.stage_type ?? "custom",
      match_day: fixture.match_day ?? 1,
      total_match_days: 0,
      manual_override: fixture.manual_importance_override ?? null,
    };

    weight_map.set(fixture.id, compute_importance_weight(weight_input));
  }

  return weight_map;
}

function group_ratings_by_official(
  ratings: OfficialPerformanceRating[],
  fixture_weight_map: Map<string, number>,
): Map<
  string,
  Array<OfficialPerformanceRating & { importance_weight: number }>
> {
  const grouped = new Map<
    string,
    Array<OfficialPerformanceRating & { importance_weight: number }>
  >();

  for (const rating of ratings) {
    const weight = fixture_weight_map.get(rating.fixture_id) ?? 1.0;
    const weighted_rating = { ...rating, importance_weight: weight };

    const existing = grouped.get(rating.official_id) ?? [];
    existing.push(weighted_rating);
    grouped.set(rating.official_id, existing);
  }

  return grouped;
}

export function build_leaderboard_entries(
  ratings: OfficialPerformanceRating[],
  fixtures: Fixture[],
  stages: CompetitionStage[],
  official_name_map: Map<string, string>,
): OfficialLeaderboardEntry[] {
  const fixture_weight_map = build_fixture_weight_map(fixtures, stages);
  const grouped = group_ratings_by_official(ratings, fixture_weight_map);

  const entries: OfficialLeaderboardEntry[] = [];

  for (const [official_id, weighted_ratings] of grouped) {
    const summary: WeightedOfficialSummary | null =
      aggregate_weighted_ratings(weighted_ratings);
    if (!summary) continue;

    entries.push({
      official_id,
      official_name: official_name_map.get(official_id) ?? "Unknown",
      rating_count: summary.rating_count,
      composite_score: Number(summary.total_weighted_score.toFixed(2)),
      tier: get_performance_tier(summary.total_weighted_score),
      overall: Number(summary.weighted_overall.toFixed(2)),
      decision_accuracy: Number(summary.weighted_decision_accuracy.toFixed(2)),
      game_control: Number(summary.weighted_game_control.toFixed(2)),
      communication: Number(summary.weighted_communication.toFixed(2)),
      fitness: Number(summary.weighted_fitness.toFixed(2)),
    });
  }

  return entries.sort((a, b) => b.composite_score - a.composite_score);
}

export function get_tier_badge_classes(tier: PerformanceTier): string {
  const classes: Record<PerformanceTier, string> = {
    elite: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    strong: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    adequate: "bg-blue-100 text-blue-800 border border-blue-300",
    needs_development: "bg-gray-100 text-gray-700 border border-gray-300",
  };
  return classes[tier];
}

export function get_score_bar_width(score: number): string {
  const percentage = Math.max(0, Math.min(100, (score / 10) * 100));
  return `${percentage}%`;
}

export function build_official_name_map(
  officials: Official[],
): Map<string, string> {
  const name_map = new Map<string, string>();
  for (const official of officials) {
    name_map.set(official.id, get_official_full_name(official));
  }
  return name_map;
}

export interface PerFixtureRating {
  fixture_label: string;
  fixture_date: string;
  rater_role: string;
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
  notes: string;
}

export function build_fixture_label_map(
  fixtures: Fixture[],
): Map<string, string> {
  const label_map = new Map<string, string>();
  for (const fixture of fixtures) {
    const home = fixture.home_team_name ?? fixture.home_team_id.slice(0, 8);
    const away = fixture.away_team_name ?? fixture.away_team_id.slice(0, 8);
    label_map.set(fixture.id, `${home} vs ${away}`);
  }
  return label_map;
}

export function filter_ratings_by_organization(
  ratings: OfficialPerformanceRating[],
  organization_id: string,
): OfficialPerformanceRating[] {
  if (!organization_id) return ratings;
  return ratings.filter((r) => r.organization_id === organization_id);
}

export function filter_ratings_by_official(
  ratings: OfficialPerformanceRating[],
  official_id: string,
): OfficialPerformanceRating[] {
  return ratings.filter((r) => r.official_id === official_id);
}

export function build_per_fixture_breakdown(
  ratings: OfficialPerformanceRating[],
  fixture_label_map: Map<string, string>,
  fixtures: Fixture[],
): PerFixtureRating[] {
  const fixture_by_id = new Map(fixtures.map((f) => [f.id, f]));
  return ratings.map((rating) => ({
    fixture_label:
      fixture_label_map.get(rating.fixture_id) ??
      `Fixture ${rating.fixture_id.slice(0, 8)}`,
    fixture_date: fixture_by_id.get(rating.fixture_id)?.scheduled_date ?? "",
    rater_role: rating.rater_role,
    overall: rating.overall,
    decision_accuracy: rating.decision_accuracy,
    game_control: rating.game_control,
    communication: rating.communication,
    fitness: rating.fitness,
    notes: rating.notes,
  }));
}
