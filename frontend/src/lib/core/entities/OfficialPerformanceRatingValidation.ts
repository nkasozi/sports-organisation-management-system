import {
  check_condition,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";
import type {
  CreateOfficialPerformanceRatingInput,
  RatingDimensions,
} from "./OfficialPerformanceRating";

const MINIMUM_DIMENSION_SCORE = 1;
const MAXIMUM_DIMENSION_SCORE = 10;
const DEFAULT_DIMENSION_SCORE = 5;
const NUMBER_TYPE_NAME = "number";

export const RATING_DIMENSION_FIELDS: ReadonlyArray<keyof RatingDimensions> = [
  "overall",
  "decision_accuracy",
  "game_control",
  "communication",
  "fitness",
];

const RATING_VALIDATION_MESSAGES = {
  OFFICIAL_REQUIRED: "Official is required",
  FIXTURE_REQUIRED: "Fixture is required",
  RATER_REQUIRED: "Rater user is required",
  DIMENSION_RANGE_SUFFIX: " must be a number between 1 and 10",
} as const;

export function create_empty_rating_input(
  organization_id: CreateOfficialPerformanceRatingInput["organization_id"] = "",
  official_id: CreateOfficialPerformanceRatingInput["official_id"] = "",
  fixture_id: CreateOfficialPerformanceRatingInput["fixture_id"] = "",
): CreateOfficialPerformanceRatingInput {
  return {
    organization_id,
    official_id,
    fixture_id,
    rater_user_id: "",
    rater_role: "",
    overall: DEFAULT_DIMENSION_SCORE,
    decision_accuracy: DEFAULT_DIMENSION_SCORE,
    game_control: DEFAULT_DIMENSION_SCORE,
    communication: DEFAULT_DIMENSION_SCORE,
    fitness: DEFAULT_DIMENSION_SCORE,
    notes: "",
    submitted_at: "",
  };
}

function is_valid_dimension_score(value: unknown): boolean {
  return (
    typeof value === NUMBER_TYPE_NAME &&
    !Number.isNaN(value) &&
    Number(value) >= MINIMUM_DIMENSION_SCORE &&
    Number(value) <= MAXIMUM_DIMENSION_SCORE
  );
}

export function validate_rating_input(
  input: CreateOfficialPerformanceRatingInput,
): string[] {
  return collect_validation_errors([
    check_condition(
      !is_blank_text(input.official_id),
      RATING_VALIDATION_MESSAGES.OFFICIAL_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.fixture_id),
      RATING_VALIDATION_MESSAGES.FIXTURE_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.rater_user_id),
      RATING_VALIDATION_MESSAGES.RATER_REQUIRED,
    ),
    ...RATING_DIMENSION_FIELDS.map((field) =>
      check_condition(
        is_valid_dimension_score(input[field]),
        `${field}${RATING_VALIDATION_MESSAGES.DIMENSION_RANGE_SUFFIX}`,
      ),
    ),
  ]);
}
