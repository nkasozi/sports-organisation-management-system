export const AUDIT_LOG_LOG_SCOPE = "[AuditLogUseCases]";

export const AUDIT_LOG_EVENT = {
  ID_MISSING: "audit_log_id_missing",
  ENTITY_TYPE_MISSING: "audit_log_entity_type_missing",
  ENTITY_ID_MISSING: "audit_log_entity_id_missing",
  USER_ID_MISSING: "audit_log_user_id_missing",
  VALIDATION_FAILED: "audit_log_validation_failed",
  MUTATION_REJECTED: "audit_log_mutation_rejected",
  LIST_FAILED: "audit_log_list_failed",
  LOOKUP_FAILED: "audit_log_lookup_failed",
  CREATE_FAILED: "audit_log_create_failed",
} as const;

export const AUDIT_LOG_MESSAGE = {
  ID_REQUIRED: "Audit log ID is required",
  ENTITY_TYPE_REQUIRED: "Entity type is required",
  ENTITY_ID_REQUIRED: "Entity ID is required",
  ACTION_REQUIRED: "Action is required",
  USER_ID_REQUIRED: "User ID is required",
  UPDATE_REJECTED: "Audit logs are immutable and cannot be updated",
  DELETE_REJECTED: "Audit logs are immutable and cannot be deleted",
} as const;
