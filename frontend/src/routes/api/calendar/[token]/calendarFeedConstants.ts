export const CALENDAR_FEED_ACCESS_STATUS = {
  GRANTED: "granted",
  REJECTED: "rejected",
} as const;

export const CALENDAR_FEED_RESPONSE_MESSAGES = {
  INVALID_TOKEN: "Invalid token format",
  NOT_FOUND: "Calendar feed not found or inactive",
  EXPIRED: "Calendar feed token has expired",
  ACTIVITIES_UNAVAILABLE:
    "Calendar feed is temporarily unavailable. Please try again later.",
} as const;

export const CALENDAR_FEED_HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  GONE: 410,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const CALENDAR_FEED_EVENTS = {
  TOKEN_EXPIRED: "calendar_token_expired",
  ACCESS_RECORD_FAILED: "calendar_feed_access_record_failed",
  ACTIVITIES_LOAD_FAILED: "calendar_feed_activities_load_failed",
} as const;
