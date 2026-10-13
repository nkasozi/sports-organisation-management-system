export const ENTITY_CRUD_VIEW = {
  LIST: "list",
  CREATE: "create",
  EDIT: "edit",
} as const;

export type EntityCrudView =
  (typeof ENTITY_CRUD_VIEW)[keyof typeof ENTITY_CRUD_VIEW];
