export const ENTITY_CRUD_WRAPPER_VIEW = {
  LIST: "list",
  CREATE: "create",
  EDIT: "edit",
} as const;

export type EntityCrudWrapperView =
  (typeof ENTITY_CRUD_WRAPPER_VIEW)[keyof typeof ENTITY_CRUD_WRAPPER_VIEW];

export const DEFAULT_ENTITY_DISPLAY_NAME = "Entity";
