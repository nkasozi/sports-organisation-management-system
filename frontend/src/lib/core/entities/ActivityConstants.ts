const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const FIXTURE_ACTIVITY_DURATION_HOURS = 2;

export const FIXTURE_ACTIVITY_DURATION_MS =
  FIXTURE_ACTIVITY_DURATION_HOURS * MILLISECONDS_PER_HOUR;

export const ACTIVITY_TITLE_MAXIMUM_LENGTH = 200;

export const FIXTURE_ACTIVITY_DESCRIPTION = "Match fixture";

export const COMPETITION_ACTIVITY_DESCRIPTION_PREFIX = "Competition: ";

export const ACTIVITY_VALIDATION_MESSAGES = {
  TITLE_REQUIRED: "Activity title is required",
  TITLE_TOO_LONG: "Activity title must be 200 characters or less",
  ORGANIZATION_REQUIRED: "Organization is required",
  CATEGORY_REQUIRED: "Category is required",
  START_REQUIRED: "Start date and time is required",
  END_REQUIRED: "End date and time is required",
  END_BEFORE_START: "End date must be after start date",
} as const;
