export const SYSTEM_USER_USE_CASES_LOG_SCOPE = "[SystemUserUseCases]";

export const SystemUserUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "system_user_create_validation_failed",
  CREATE_EMAIL_CHECK_FAILED: "system_user_create_email_check_failed",
  CREATE_EMAIL_TAKEN: "system_user_create_email_taken",
  CREATE_FAILED: "system_user_create_failed",
  UPDATE_ID_MISSING: "system_user_update_id_missing",
  UPDATE_EMAIL_CHECK_FAILED: "system_user_update_email_check_failed",
  UPDATE_EMAIL_TAKEN: "system_user_update_email_taken",
  UPDATE_FAILED: "system_user_update_failed",
  DELETE_ID_MISSING: "system_user_delete_id_missing",
  DELETE_FAILED: "system_user_delete_failed",
  GET_ID_MISSING: "system_user_get_id_missing",
  GET_FAILED: "system_user_get_failed",
  GET_BY_EMAIL_MISSING: "system_user_get_by_email_missing",
  GET_BY_EMAIL_LOOKUP_FAILED: "system_user_get_by_email_lookup_failed",
  GET_BY_EMAIL_NOT_FOUND: "system_user_get_by_email_not_found",
  LIST_FAILED: "system_user_list_failed",
} as const;

export const SystemUserUseCaseMessage = {
  ID_REQUIRED: "User ID is required",
  EMAIL_REQUIRED: "Email is required",
  DUPLICATE_EMAIL: "A user with this email already exists",
} as const;

export function build_user_email_not_found_message(email: string): string {
  return `User with email '${email}' not found`;
}

export const EmailAvailability = {
  AVAILABLE: "available",
  TAKEN: "taken",
} as const;

export type EmailAvailability =
  (typeof EmailAvailability)[keyof typeof EmailAvailability];
