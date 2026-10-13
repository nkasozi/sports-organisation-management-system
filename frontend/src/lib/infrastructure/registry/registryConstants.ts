import type { FieldMetadata } from "../../core/entities/BaseEntity";

export const FOREIGN_KEY_FIELD_TYPE =
  "foreign_key" satisfies FieldMetadata["field_type"];

export const ENTITY_TYPES_SKIPPING_AUDIT_EVENTS: readonly string[] = [
  "auditlog",
];

export const REGISTRY_LOG_EVENT = {
  INVALID_ENTITY_TYPE: "use_case_registry_invalid_entity_type",
  UNKNOWN_ENTITY_TYPE: "use_case_registry_unknown_entity_type",
  PREVIOUS_ENTITY_UNAVAILABLE: "entity_event_previous_entity_unavailable",
  ORGANIZATION_DEFAULTS_SEED_FAILED:
    "use_case_registry_organization_defaults_seed_failed",
  ORGANIZATION_SEED_SPORT_MISSING:
    "use_case_registry_organization_seed_sport_missing",
} as const;

export const REGISTRY_ERROR_MESSAGE = {
  INVALID_ENTITY_TYPE: "Invalid or missing entity type",
  UNKNOWN_ENTITY_TYPE: "Unknown entity type",
} as const;

export const ENTITY_EVENT_OPERATION = {
  UPDATE: "update",
  DELETE: "delete",
} as const;

export const CURRENT_PROFILE_PRESENT_STATUS = "present";
