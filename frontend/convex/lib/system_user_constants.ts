export { GLOBAL_ORGANIZATION_ID } from "./caller_scope";

export const SUPER_ADMIN_ROLE = "super_admin";

export const SystemUserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const SYSTEM_USERS_TABLE_NAME = "system_users";
export const SYSTEM_USER_ENTITY_TYPE = "systemuser";
export const SYSTEM_USER_EMAIL_INDEX_NAME = "by_email";
export const SYSTEM_USER_ROLE_INDEX_NAME = "by_role";
