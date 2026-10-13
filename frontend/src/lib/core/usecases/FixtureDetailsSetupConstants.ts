export const FIXTURE_DETAILS_SETUP_LOG_SCOPE = "[FixtureDetailsSetupUseCases]";

export const DEFAULT_SETUP_PAGE_NUMBER = 1;

export const DEFAULT_SETUP_PAGE_SIZE = 50;

export const EXISTING_SETUP_PROBE_PAGE_SIZE = 1;

export const FIXTURE_DETAILS_SETUP_EVENT = {
  ID_MISSING: "fixture_details_setup_id_missing",
  FIXTURE_ID_MISSING: "fixture_details_setup_fixture_id_missing",
  OFFICIAL_ID_MISSING: "fixture_details_setup_official_id_missing",
  VALIDATION_FAILED: "fixture_details_setup_validation_failed",
  ALREADY_EXISTS: "fixture_details_setup_already_exists",
  EXISTING_CHECK_FAILED: "fixture_details_setup_existing_check_failed",
  NOT_FOUND: "fixture_details_setup_not_found",
  LIST_FAILED: "fixture_details_setup_list_failed",
  LOOKUP_FAILED: "fixture_details_setup_lookup_failed",
  CREATE_FAILED: "fixture_details_setup_create_failed",
  UPDATE_FAILED: "fixture_details_setup_update_failed",
  DELETE_FAILED: "fixture_details_setup_delete_failed",
} as const;

export const FIXTURE_DETAILS_SETUP_MESSAGE = {
  ID_REQUIRED: "Fixture Details Setup ID is required",
  FIXTURE_ID_REQUIRED: "Fixture ID is required",
  OFFICIAL_ID_REQUIRED: "Official ID is required",
  VALIDATION_FAILED: "Validation failed",
  ALREADY_EXISTS:
    "A fixture details setup already exists for this fixture. Please edit the existing setup instead.",
  NOT_FOUND: "Fixture details setup assignment not found",
} as const;

export const ASSIGNMENT_DECISION = {
  CONFIRM: "confirm",
  DECLINE: "decline",
} as const;

export type AssignmentDecision =
  (typeof ASSIGNMENT_DECISION)[keyof typeof ASSIGNMENT_DECISION];
