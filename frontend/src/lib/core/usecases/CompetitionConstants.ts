export const COMPETITION_LOG_SCOPE = "[CompetitionUseCases]";

export const COMPETITION_ENTITY_TYPE = "competition";

export const COMPETITION_EVENT = {
  ID_MISSING: "competition_id_missing",
  IDS_MISSING: "competition_ids_missing",
  ORGANIZATION_ID_MISSING: "competition_organization_id_missing",
  VALIDATION_FAILED: "competition_validation_failed",
  LIST_FAILED: "competition_list_failed",
  LOOKUP_FAILED: "competition_lookup_failed",
  NOT_FOUND: "competition_not_found",
  CREATE_FAILED: "competition_create_failed",
  UPDATE_FAILED: "competition_update_failed",
  DELETE_FAILED: "competition_delete_failed",
  BULK_DELETE_FAILED: "competition_bulk_delete_failed",
  BULK_DELETE_LOOKUP_FAILED: "competition_bulk_delete_lookup_failed",
  STAGE_SETUP_FAILED: "competition_stage_setup_failed",
  STAGE_REPLACEMENT_BLOCKED: "competition_stage_replacement_blocked",
  CREATE_ROLLBACK_FAILED: "competition_create_rollback_failed",
} as const;

export const COMPETITION_MESSAGE = {
  ID_REQUIRED: "Competition ID is required",
  IDS_REQUIRED: "At least one competition ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  NOT_FOUND: "Competition not found",
} as const;

export const COMPETITION_OPERATION = {
  GET: "get",
  UPDATE: "update",
  DELETE: "delete",
  LIST_BY_ORGANIZATION: "list_by_organization",
} as const;
