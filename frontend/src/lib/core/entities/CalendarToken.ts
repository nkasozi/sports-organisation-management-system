import type {
  CalendarFeedEntityId,
  CalendarTokenValue,
  EntityId,
  IsoDateTimeString,
  Name,
} from "../types/DomainScalars";
import { parse_entity_id } from "../types/DomainScalars";
import type { Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import type { BaseEntity } from "./BaseEntity";

export type CalendarFeedType = "all" | "team" | "competition" | "player";

export interface CalendarToken extends BaseEntity {
  token: CalendarTokenValue;
  user_id: EntityId;
  organization_id: EntityId;
  feed_type: CalendarFeedType;
  entity_id: CalendarFeedEntityId | "";
  entity_name: Name | "";
  reminder_minutes_before: number;
  is_active: boolean;
  last_accessed_at: IsoDateTimeString | "";
  access_count: number;
  expires_at: IsoDateTimeString;
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
const INVALID_CALENDAR_FEED_ENTITY_ID_ERROR =
  "Calendar feed entity ID is invalid";

export function compute_calendar_token_expiry(): CalendarToken["expires_at"] {
  const expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + CALENDAR_TOKEN_EXPIRY_DAYS);
  return expiry_date.toISOString() as CalendarToken["expires_at"];
}

export function is_calendar_token_expired(
  expires_at: CalendarToken["expires_at"],
): boolean {
  return new Date(expires_at).getTime() < Date.now();
}

export function generate_calendar_token(): CalendarTokenValue {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  ) as CalendarTokenValue;
}

export function build_ical_feed_url(
  base_url: string,
  token: CalendarTokenValue,
): string {
  return `${base_url}/api/calendar/${token}.ics`;
}

export function build_webcal_feed_url(
  base_url: string,
  token: CalendarTokenValue,
): string {
  const https_url = build_ical_feed_url(base_url, token);
  return https_url.replace(/^https?:/, "webcal:");
}

export function parse_calendar_feed_entity_id(
  feed_type: CalendarFeedType,
  raw_entity_id: string,
): Result<CalendarFeedEntityId | ""> {
  if (feed_type === "all") {
    return create_success_result("");
  }

  if (!raw_entity_id) {
    return create_failure_result(INVALID_CALENDAR_FEED_ENTITY_ID_ERROR);
  }

  switch (feed_type) {
    case "team":
      return parse_entity_id(
        raw_entity_id,
        INVALID_CALENDAR_FEED_ENTITY_ID_ERROR,
      );
    case "competition":
      return parse_entity_id(
        raw_entity_id,
        INVALID_CALENDAR_FEED_ENTITY_ID_ERROR,
      );
    case "player":
      return parse_entity_id(
        raw_entity_id,
        INVALID_CALENDAR_FEED_ENTITY_ID_ERROR,
      );
  }

  return create_failure_result(INVALID_CALENDAR_FEED_ENTITY_ID_ERROR);
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
