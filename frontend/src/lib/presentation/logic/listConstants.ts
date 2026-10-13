import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

export const LIST_FOREIGN_KEY_FIELD_TYPE =
  "foreign_key" satisfies FieldMetadata["field_type"];

export const LIST_ENTITY_ID_FIELD_NAME = "id";

export const LIST_SORT_DIRECTION = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const;

export type ListSortDirection =
  (typeof LIST_SORT_DIRECTION)[keyof typeof LIST_SORT_DIRECTION];

export const LIST_BOOLEAN_LABEL = {
  TRUE: "Yes",
  FALSE: "No",
} as const;

export const LIST_SORT_LOCALE = "en";
