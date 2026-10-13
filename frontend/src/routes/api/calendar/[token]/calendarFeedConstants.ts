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
  ACTIVITIES_LOAD_FAILED: "calendar_feed_activities_load_failed",
  BACKEND_NOT_CONFIGURED: "calendar_feed_backend_not_configured",
} as const;
