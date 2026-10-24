import type { FieldMetadata } from "../../core/entities/BaseEntity";

export const FAKE_DATA_FIELD_TYPE = {
  STRING: "string",
  NUMBER: "number",
  STAR_RATING: "star_rating",
  BOOLEAN: "boolean",
  DATE: "date",
  ENUM: "enum",
  FOREIGN_KEY: "foreign_key",
  FILE: "file",
  SUB_ENTITY: "sub_entity",
  OFFICIAL_ASSIGNMENT_ARRAY: "official_assignment_array",
  STAGE_TEMPLATE_ARRAY: "stage_template_array",
} as const satisfies Record<string, FieldMetadata["field_type"]>;

export const FAKE_DATA_SKIPPED_FIELD_NAMES: readonly string[] = [
  "id",
  "created_at",
  "updated_at",
];

export const FAKE_DATA_EMPTY_VALUE = "";

export const FAKE_DATA_ERROR_MESSAGE = {
  DISABLED: "Fake data generation is disabled",
  FAILED: "Failed to generate fake data",
} as const;

export const FAKE_DATA_LOG_EVENT = {
  GENERATION_FAILED: "fake_data_generation_failed",
} as const;

export const FAKE_DATA_DEFAULT_LOCALE = "en";

export const FAKE_DATA_STATUS_FIELD_NAME = "status";

export const FAKE_DATA_ACTIVE_STATUS = "active";
