export const BULK_PLAYER_ASSIGNMENT_EVENTS = {
  ACCESS_CHECK_FAILED: "bulk_player_assignment_access_check_failed",
} as const;

export const BULK_PLAYER_ASSIGNMENT_MESSAGES = {
  ACCESS_CHECK_FAILED:
    "We couldn't confirm your permission to assign players. Please refresh the page and try again.",
} as const;

export const BULK_PLAYER_ASSIGNMENT_AUTHORIZATION = {
  ENTITY_TYPE: "playerteammembership",
  ACTION: "create",
} as const;

export const BULK_PLAYER_ASSIGNMENT_ROUTES = {
  HOME: "/",
  MEMBERSHIPS: "/player-team-memberships",
} as const;

export const BULK_PLAYER_ASSIGNMENT_TOAST_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
} as const;

export type BulkPlayerAssignmentToastType =
  (typeof BULK_PLAYER_ASSIGNMENT_TOAST_TYPE)[keyof typeof BULK_PLAYER_ASSIGNMENT_TOAST_TYPE];

export const BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS = {
  SUCCESS_COUNT: "{success_count}",
  ERROR_COUNT: "{error_count}",
  TEAM_NAME: "{team_name}",
} as const;

export const BULK_PLAYER_ASSIGNMENT_REDIRECT_DELAY_MS = 1500;
