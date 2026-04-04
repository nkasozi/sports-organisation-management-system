import type { BaseEntity } from "./BaseEntity";

export type CalendarFeedType = "all" | "team" | "competition" | "player";

export interface CalendarToken extends BaseEntity {
  token: string;
  user_id: string;
  organization_id: string;
  feed_type: CalendarFeedType;
  entity_id: string | null;
  entity_name: string | null;
  reminder_minutes_before: number;
  is_active: boolean;
  last_accessed_at: string | null;
  access_count: number;
  expires_at: string | null;
}

export type CreateCalendarTokenInput = Omit<
  CalendarToken,
  | "id"
  | "created_at"
  | "updated_at"
  | "last_accessed_at"
  | "access_count"
  | "expires_at"
>;

export type UpdateCalendarTokenInput = Partial<
  Pick<CalendarToken, "reminder_minutes_before" | "is_active" | "expires_at">
>;

const CALENDAR_TOKEN_EXPIRY_DAYS = 90;

export function compute_calendar_token_expiry(): string {
  const expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + CALENDAR_TOKEN_EXPIRY_DAYS);
  return expiry_date.toISOString();
}

export function is_calendar_token_expired(
  expires_at: string | null | undefined,
): boolean {
  if (!expires_at) {
    return false;
  }
  return new Date(expires_at).getTime() < Date.now();
}

export function generate_calendar_token(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function build_ical_feed_url(base_url: string, token: string): string {
  return `${base_url}/api/calendar/${token}.ics`;
}

export function build_webcal_feed_url(base_url: string, token: string): string {
  const https_url = build_ical_feed_url(base_url, token);
  return https_url.replace(/^https?:/, "webcal:");
}

export function get_feed_type_display_name(
  feed_type: CalendarFeedType,
): string {
  switch (feed_type) {
    case "all":
      return "All Events";
    case "team":
      return "Team Schedule";
    case "competition":
      return "Competition Schedule";
    case "player":
      return "Player Schedule";
  }
}
