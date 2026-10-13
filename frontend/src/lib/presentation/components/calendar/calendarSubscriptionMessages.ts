export const CALENDAR_SUBSCRIPTION_MESSAGES = {
  LOAD_FAILED:
    "We couldn't load your calendar subscriptions. Please close this window and try again.",
  INVALID_SCOPE:
    "Calendar subscriptions need a specific organization and user. Please select an organization and try again.",
  CREATE_FAILED:
    "We couldn't create the subscription. Please check your selection and try again.",
  REVOKE_FAILED:
    "We couldn't revoke this subscription. Please try again in a moment.",
  COPY_FAILED:
    "We couldn't copy the link. Please select it and copy it manually.",
  ORGANIZATION_ID_INVALID: "Organization ID is invalid",
  USER_ID_INVALID: "User ID is invalid",
} as const;

export const CALENDAR_SUBSCRIPTION_LOG_EVENTS = {
  LOAD_SCOPE_INVALID: "calendar_subscription_load_scope_invalid",
  LOAD_FAILED: "calendar_subscription_load_failed",
  CREATE_INPUT_INVALID: "calendar_subscription_create_input_invalid",
  CREATE_FAILED: "calendar_subscription_create_failed",
  REVOKE_INPUT_INVALID: "calendar_subscription_revoke_input_invalid",
  REVOKE_FAILED: "calendar_subscription_revoke_failed",
} as const;

export const CALENDAR_SUBSCRIPTION_LOG_TAG = "[CalendarSubscription]";

export const CALENDAR_SUBSCRIPTION_COPY_FEEDBACK_MS = 2000;

export const CALENDAR_SUBSCRIPTION_TEXT = {
  TITLE: "Calendar Subscriptions",
  DESCRIPTION:
    "Subscribe to your calendar in Google Calendar, Apple Calendar, Outlook, or any app that supports iCal feeds.",
} as const;
