import type { BaseEntity } from "./BaseEntity";

export type RaterRole = "officials_manager" | "team_manager" | (string & {});

export interface OfficialPerformanceRating extends BaseEntity {
  organization_id: string;
  official_id: string;
  fixture_id: string;
  rater_user_id: string;
  rater_role: RaterRole;
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
  notes: string;
  submitted_at: string;
}

export interface RatingDimensions {
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
}

export type CreateOfficialPerformanceRatingInput = Omit<
  OfficialPerformanceRating,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOfficialPerformanceRatingInput =
  Partial<CreateOfficialPerformanceRatingInput>;

export interface WeightedOfficialSummary {
  official_id: string;
  total_weighted_score: number;
  total_weight: number;
  rating_count: number;
  weighted_overall: number;
  weighted_decision_accuracy: number;
  weighted_game_control: number;
  weighted_communication: number;
  weighted_fitness: number;
}

export type PerformanceTier =
  | "elite"
  | "strong"
  | "adequate"
  | "needs_development";

export function get_performance_tier(composite_score: number): PerformanceTier {
  if (composite_score >= 8.5) return "elite";
  if (composite_score >= 7.0) return "strong";
  if (composite_score >= 5.5) return "adequate";
  return "needs_development";
}

export function get_tier_label(tier: PerformanceTier): string {
  const labels: Record<PerformanceTier, string> = {
    elite: "Elite",
    strong: "Strong",
    adequate: "Adequate",
    needs_development: "Needs Development",
  };
  return labels[tier];
}

export function compute_composite_score(rating: RatingDimensions): number {
  const dimension_sum =
    rating.overall +
    rating.decision_accuracy +
    rating.game_control +
    rating.communication +
    rating.fitness;
  return dimension_sum / 5;
}

export function aggregate_weighted_ratings(
  ratings: Array<OfficialPerformanceRating & { importance_weight: number }>,
): WeightedOfficialSummary | null {
  if (ratings.length === 0) return null;

  const official_id = ratings[0].official_id;
  let total_weight = 0;
  let weighted_overall = 0;
  let weighted_decision_accuracy = 0;
  let weighted_game_control = 0;
  let weighted_communication = 0;
  let weighted_fitness = 0;

  for (const rating of ratings) {
    const weight = rating.importance_weight;
    total_weight += weight;
    weighted_overall += rating.overall * weight;
    weighted_decision_accuracy += rating.decision_accuracy * weight;
    weighted_game_control += rating.game_control * weight;
    weighted_communication += rating.communication * weight;
    weighted_fitness += rating.fitness * weight;
  }

  const safe_total = total_weight === 0 ? 1 : total_weight;

  return {
    official_id,
    total_weighted_score:
      (weighted_overall +
        weighted_decision_accuracy +
        weighted_game_control +
        weighted_communication +
        weighted_fitness) /
      (5 * safe_total),
    total_weight,
    rating_count: ratings.length,
    weighted_overall: weighted_overall / safe_total,
    weighted_decision_accuracy: weighted_decision_accuracy / safe_total,
    weighted_game_control: weighted_game_control / safe_total,
    weighted_communication: weighted_communication / safe_total,
    weighted_fitness: weighted_fitness / safe_total,
  };
}

export function create_empty_rating_input(
  organization_id: string = "",
  official_id: string = "",
  fixture_id: string = "",
): CreateOfficialPerformanceRatingInput {
  return {
    organization_id,
    official_id,
    fixture_id,
    rater_user_id: "",
    rater_role: "",
    overall: 5,
    decision_accuracy: 5,
    game_control: 5,
    communication: 5,
    fitness: 5,
    notes: "",
    submitted_at: "",
  };
}

export function validate_rating_input(
  input: CreateOfficialPerformanceRatingInput,
): string[] {
  const errors: string[] = [];

  if (!input.official_id?.trim()) {
    errors.push("Official is required");
  }
  if (!input.fixture_id?.trim()) {
    errors.push("Fixture is required");
  }
  if (!input.rater_user_id?.trim()) {
    errors.push("Rater user is required");
  }

  const dimension_fields: Array<keyof RatingDimensions> = [
    "overall",
    "decision_accuracy",
    "game_control",
    "communication",
    "fitness",
  ];

  for (const field of dimension_fields) {
    const value = input[field];
    if (
      typeof value !== "number" ||
      Number.isNaN(value) ||
      value < 1 ||
      value > 10
    ) {
      errors.push(`${field} must be a number between 1 and 10`);
    }
  }

  return errors;
}
