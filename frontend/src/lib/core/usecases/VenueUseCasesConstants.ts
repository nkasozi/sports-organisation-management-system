export const VENUE_USE_CASES_LOG_SCOPE = "[VenueUseCases]";

export const VenueUseCaseEvent = {
  LIST_FAILED: "venue_list_failed",
  GET_ID_MISSING: "venue_get_id_missing",
  GET_FAILED: "venue_get_failed",
  CREATE_VALIDATION_FAILED: "venue_create_validation_failed",
  CREATE_FAILED: "venue_create_failed",
  UPDATE_ID_MISSING: "venue_update_id_missing",
  UPDATE_FAILED: "venue_update_failed",
  DELETE_ID_MISSING: "venue_delete_id_missing",
  DELETE_FAILED: "venue_delete_failed",
  BULK_DELETE_IDS_MISSING: "venue_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "venue_bulk_delete_failed",
} as const;

export const VenueUseCaseMessage = {
  ID_REQUIRED: "Venue ID is required",
  IDS_REQUIRED: "At least one venue ID is required",
} as const;
