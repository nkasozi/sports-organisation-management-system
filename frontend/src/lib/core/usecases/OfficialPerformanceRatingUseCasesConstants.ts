export const OFFICIAL_PERFORMANCE_RATING_USE_CASES_LOG_SCOPE =
  "[OfficialPerformanceRatingUseCases]";

export const OfficialPerformanceRatingUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "official_rating_create_validation_failed",
  CREATE_FAILED: "official_rating_create_failed",
  UPDATE_TARGET_NOT_FOUND: "official_rating_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "official_rating_update_validation_failed",
  UPDATE_FAILED: "official_rating_update_failed",
  DELETE_FAILED: "official_rating_delete_failed",
  GET_FAILED: "official_rating_get_failed",
  LIST_FAILED: "official_rating_list_failed",
  LIST_BY_OFFICIAL_FAILED: "official_rating_list_by_official_failed",
  LIST_BY_FIXTURE_FAILED: "official_rating_list_by_fixture_failed",
  SUBMIT_VALIDATION_FAILED: "official_rating_submit_validation_failed",
  SUBMIT_LOOKUP_FAILED: "official_rating_submit_lookup_failed",
  SUBMIT_UPDATE_FAILED: "official_rating_submit_update_failed",
  SUBMIT_CREATE_FAILED: "official_rating_submit_create_failed",
} as const;

export const OfficialPerformanceRatingUseCaseMessage = {
  NOT_FOUND: "Rating not found",
} as const;

export const CurrentUserStatus = {
  AVAILABLE: "available",
  ANONYMOUS: "anonymous",
} as const;

export const ExistingRatingLookupStatus = {
  FOUND: "found",
  NONE: "none",
} as const;

export const OFFICIAL_PERFORMANCE_RATING_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;

export const OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 200,
} as const;
