import type {
  EntityId,
  IsoDateTimeString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";
import { RATING_DIMENSION_FIELDS } from "./OfficialPerformanceRatingValidation";

const RATER_ROLE = {
  OFFICIALS_MANAGER: "officials_manager",
  TEAM_MANAGER: "team_manager",
} as const;

export type RaterRole =
  | (typeof RATER_ROLE)[keyof typeof RATER_ROLE]
  | (string & {});

export interface OfficialPerformanceRating extends BaseEntity {
  organization_id: EntityId;
  official_id: EntityId;
  fixture_id: EntityId;
  rater_user_id: EntityId;
  rater_role: RaterRole;
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
  notes: string;
  submitted_at: IsoDateTimeString;
}

export interface RatingDimensions {
  overall: number;
  decision_accuracy: number;
  game_control: number;
  communication: number;
  fitness: number;
}

export type CreateOfficialPerformanceRatingInput = Omit<
  ScalarInput<OfficialPerformanceRating>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOfficialPerformanceRatingInput =
  Partial<CreateOfficialPerformanceRatingInput>;

export interface WeightedOfficialSummary {
  official_id: EntityId;
  total_weighted_score: number;
  total_weight: number;
  rating_count: number;
  weighted_overall: number;
  weighted_decision_accuracy: number;
  weighted_game_control: number;
  weighted_communication: number;
  weighted_fitness: number;
}

const WEIGHTED_SUMMARY_STATUS = {
  EMPTY: "empty",
  PRESENT: "present",
} as const;

type WeightedOfficialSummaryResult =
  | { status: typeof WEIGHTED_SUMMARY_STATUS.EMPTY }
  | {
      status: typeof WEIGHTED_SUMMARY_STATUS.PRESENT;
      summary: WeightedOfficialSummary;
    };

export const PERFORMANCE_TIER = {
  ELITE: "elite",
  STRONG: "strong",
  ADEQUATE: "adequate",
  NEEDS_DEVELOPMENT: "needs_development",
} as const;

export type PerformanceTier =
  (typeof PERFORMANCE_TIER)[keyof typeof PERFORMANCE_TIER];

const ELITE_MINIMUM_SCORE = 8.5;
const STRONG_MINIMUM_SCORE = 7.0;
const ADEQUATE_MINIMUM_SCORE = 5.5;

export function get_performance_tier(composite_score: number): PerformanceTier {
  if (composite_score >= ELITE_MINIMUM_SCORE) return PERFORMANCE_TIER.ELITE;
  if (composite_score >= STRONG_MINIMUM_SCORE) return PERFORMANCE_TIER.STRONG;
  if (composite_score >= ADEQUATE_MINIMUM_SCORE)
    return PERFORMANCE_TIER.ADEQUATE;
  return PERFORMANCE_TIER.NEEDS_DEVELOPMENT;
}

const PERFORMANCE_TIER_LABELS: Readonly<Record<PerformanceTier, string>> = {
  elite: "Elite",
  strong: "Strong",
  adequate: "Adequate",
  needs_development: "Needs Development",
};

export function get_tier_label(tier: PerformanceTier): string {
  return PERFORMANCE_TIER_LABELS[tier];
}

function sum_dimensions(rating: RatingDimensions): number {
  return RATING_DIMENSION_FIELDS.reduce(
    (total, field) => total + rating[field],
    0,
  );
}

export function compute_composite_score(rating: RatingDimensions): number {
  return sum_dimensions(rating) / RATING_DIMENSION_FIELDS.length;
}

function weighted_dimension_totals(
  ratings: Array<OfficialPerformanceRating & { importance_weight: number }>,
): RatingDimensions {
  const totals: RatingDimensions = {
    overall: 0,
    decision_accuracy: 0,
    game_control: 0,
    communication: 0,
    fitness: 0,
  };
  for (const rating of ratings) {
    for (const field of RATING_DIMENSION_FIELDS) {
      totals[field] += rating[field] * rating.importance_weight;
    }
  }
  return totals;
}

export function aggregate_weighted_ratings(
  ratings: Array<OfficialPerformanceRating & { importance_weight: number }>,
): WeightedOfficialSummaryResult {
  if (ratings.length === 0) return { status: WEIGHTED_SUMMARY_STATUS.EMPTY };

  const total_weight = ratings.reduce(
    (total, rating) => total + rating.importance_weight,
    0,
  );
  const totals = weighted_dimension_totals(ratings);
  const safe_total = total_weight === 0 ? 1 : total_weight;

  return {
    status: WEIGHTED_SUMMARY_STATUS.PRESENT,
    summary: {
      official_id: ratings[0].official_id,
      total_weighted_score:
        sum_dimensions(totals) / (RATING_DIMENSION_FIELDS.length * safe_total),
      total_weight,
      rating_count: ratings.length,
      weighted_overall: totals.overall / safe_total,
      weighted_decision_accuracy: totals.decision_accuracy / safe_total,
      weighted_game_control: totals.game_control / safe_total,
      weighted_communication: totals.communication / safe_total,
      weighted_fitness: totals.fitness / safe_total,
    },
  };
}

export {
  create_empty_rating_input,
  validate_rating_input,
} from "./OfficialPerformanceRatingValidation";
