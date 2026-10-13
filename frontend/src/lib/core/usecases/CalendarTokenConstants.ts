export const CALENDAR_TOKEN_LOG_SCOPE = "[CalendarTokenUseCases]";

export const DEFAULT_REMINDER_MINUTES = 60;

export const CALENDAR_TOKEN_EVENT = {
  LIST_FAILED: "calendar_token_list_failed",
  LOOKUP_FAILED: "calendar_token_lookup_failed",
  CREATE_FAILED: "calendar_token_create_failed",
  UPDATE_FAILED: "calendar_token_update_failed",
  DELETE_FAILED: "calendar_token_delete_failed",
  FEED_CREATE_FAILED: "calendar_feed_create_failed",
  FEED_REVOKE_FAILED: "calendar_feed_revoke_failed",
  FEED_ACCESS_RECORD_FAILED: "calendar_feed_access_record_failed",
  FEED_SETTINGS_TOKEN_MISSING: "calendar_feed_settings_token_missing",
  FEED_SETTINGS_LOOKUP_FAILED: "calendar_feed_settings_lookup_failed",
  FEED_SETTINGS_UPDATE_FAILED: "calendar_feed_settings_update_failed",
} as const;

export const CALENDAR_TOKEN_MESSAGE = {
  TOKEN_NOT_FOUND: "Token not found",
} as const;
