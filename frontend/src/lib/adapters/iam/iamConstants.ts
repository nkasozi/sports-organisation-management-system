import type {
  AuthorizationFailure,
  DataAction,
  DataCategory,
  UserRole,
} from "$lib/core/interfaces/ports";

const DATA_ACTION = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
} as const satisfies Record<string, DataAction>;

export const ALL_DATA_ACTIONS: readonly DataAction[] = [
  DATA_ACTION.CREATE,
  DATA_ACTION.READ,
  DATA_ACTION.UPDATE,
  DATA_ACTION.DELETE,
];

export const ALL_DATA_CATEGORIES: readonly DataCategory[] = [
  "root_level",
  "org_administrator_level",
  "organisation_level",
  "team_level",
  "player_level",
  "public_level",
];

export const AUTHORIZATION_FAILURE_TYPE = {
  TOKEN_INVALID: "token_invalid",
  TOKEN_EXPIRED: "token_expired",
  PERMISSION_DENIED: "permission_denied",
} as const satisfies Record<string, AuthorizationFailure["failure_type"]>;

export const IAM_ROLE = {
  PUBLIC_VIEWER: "public_viewer",
} as const satisfies Record<string, UserRole>;

export const IAM_SCOPE = {
  ALL_TEAMS: "*",
  ALL_ENTITIES: "*",
} as const;

export const TOKEN_EXPIRED_MARKER = "expired";

export const AUTHORIZATION_CACHE_KEY_PREFIX = {
  PROFILE_PERMISSIONS: "profile_permissions",
  SIDEBAR_MENU: "sidebar_menu",
  ROUTE_ACCESS: "route_access",
  ENTITY_AUTHORIZATION: "entity_auth",
  ALLOWED_ACTIONS: "allowed_actions",
  DISABLED_ACTIONS: "disabled_actions",
} as const;

export const IAM_MESSAGE = {
  ACCESS_DENIED: "Access denied",
  AUTHORIZATION_UNAVAILABLE:
    "We could not check your permissions right now. Please try again.",
  TOKEN_VERIFICATION_FAILED: "Token verification failed",
  INVALID_OR_EXPIRED_TOKEN: "Invalid or expired authentication token",
  NO_ACTIVE_CLERK_SESSION: "No active Clerk session - user is not signed in",
  CLERK_USER_UNAVAILABLE: "Clerk session exists but user data is unavailable",
} as const;

export const IAM_LOG_EVENT = {
  ROLE_LOOKUP_FAILED: "iam_role_lookup_failed",
  ROLE_LOOKUP_USER_NOT_FOUND: "iam_role_lookup_user_not_found",
  ROLE_LOOKUP_USER_INACTIVE: "iam_role_lookup_user_inactive",
  ROLE_LOOKUP_ROLE_UNKNOWN: "iam_role_lookup_role_unknown",
  TOKEN_VERIFICATION_FAILED: "iam_token_verification_failed",
  TOKEN_REJECTED: "iam_token_rejected",
  AUTHORIZATION_CACHE_HIT: "iam_authorization_cache_hit",
  PROFILE_PERMISSIONS_RESOLVED: "iam_profile_permissions_resolved",
  SIDEBAR_MENU_RESOLVED: "iam_sidebar_menu_resolved",
  CLERK_TOKEN_GENERATED: "clerk_token_generated",
  CLERK_TOKEN_VERIFIED: "clerk_token_verified",
  CLERK_TOKEN_CACHE_HIT: "clerk_token_cache_hit",
  CLERK_NO_ACTIVE_SESSION: "clerk_no_active_session",
  CLERK_USER_UNAVAILABLE: "clerk_user_unavailable",
} as const;

export const IAM_ROUTE = {
  HOME: "/",
  MATCH_REPORT: "/match-report",
  COMPETITION_RESULTS: "/competition-results",
  HELP: "/help",
  HOW_IT_WORKS: "/how-it-works",
} as const;

export const ROUTE_ACCESS_AUDIT = {
  ENTITY_TYPE: "route",
  ACTION: "access",
  DATA_CATEGORY: "navigation",
  SOURCE: "route_access_check",
} as const;

export const SINGLETON_STATUS = {
  UNINITIALIZED: "uninitialized",
  READY: "ready",
} as const;
