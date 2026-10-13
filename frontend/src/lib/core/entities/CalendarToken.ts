import type {
  CalendarFeedEntityId,
  CalendarTokenValue,
  EntityId,
  IsoDateTimeString,
  Name,
} from "../types/DomainScalars";
import { parse_entity_id } from "../types/DomainScalars";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import type { BaseEntity } from "./BaseEntity";

export const CALENDAR_FEED_TYPE = {
  ALL: "all",
  TEAM: "team",
  COMPETITION: "competition",
  PLAYER: "player",
} as const;

export type CalendarFeedType =
  (typeof CALENDAR_FEED_TYPE)[keyof typeof CALENDAR_FEED_TYPE];

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
const NO_CALENDAR_FEED_ENTITY_ID = "";
const CALENDAR_TOKEN_BYTE_LENGTH = 32;
const HEX_RADIX = 16;
const HEX_BYTE_WIDTH = 2;
const HEX_PAD_CHARACTER = "0";
const TOKEN_HEX_JOIN_SEPARATOR = "";
const ICAL_FEED_PATH_PREFIX = "/api/calendar/";
const ICAL_FEED_EXTENSION = ".ics";
const HTTP_SCHEME_PATTERN = /^https?:/;
const WEBCAL_SCHEME = "webcal:";
const INVALID_CALENDAR_FEED_ENTITY_ID_ERROR =
  "Calendar feed entity ID is invalid";

export function compute_calendar_token_expiry(): CalendarToken["expires_at"] {
  const expiry_date = new Date();
  expiry_date.setDate(expiry_date.getDate() + CALENDAR_TOKEN_EXPIRY_DAYS);
  return expiry_date.toISOString() as CalendarToken["expires_at"];
}

function is_calendar_token_expired(
  expires_at: CalendarToken["expires_at"],
): boolean {
  return new Date(expires_at).getTime() < Date.now();
}

export function generate_calendar_token(): CalendarTokenValue {
  const array = new Uint8Array(CALENDAR_TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    byte.toString(HEX_RADIX).padStart(HEX_BYTE_WIDTH, HEX_PAD_CHARACTER),
  ).join(TOKEN_HEX_JOIN_SEPARATOR) as CalendarTokenValue;
}

export function build_ical_feed_url(
  base_url: string,
  token: CalendarTokenValue,
): string {
  return `${base_url}${ICAL_FEED_PATH_PREFIX}${token}${ICAL_FEED_EXTENSION}`;
}

export function build_webcal_feed_url(
  base_url: string,
  token: CalendarTokenValue,
): string {
  const https_url = build_ical_feed_url(base_url, token);
  return https_url.replace(HTTP_SCHEME_PATTERN, WEBCAL_SCHEME);
}

export function parse_calendar_feed_entity_id(
  feed_type: CalendarFeedType,
  raw_entity_id: string,
): Result<CalendarFeedEntityId | typeof NO_CALENDAR_FEED_ENTITY_ID> {
  switch (feed_type) {
    case CALENDAR_FEED_TYPE.ALL:
      return create_success_result(NO_CALENDAR_FEED_ENTITY_ID);
    case CALENDAR_FEED_TYPE.TEAM:
    case CALENDAR_FEED_TYPE.COMPETITION:
    case CALENDAR_FEED_TYPE.PLAYER:
      return parse_entity_id(
        raw_entity_id,
        INVALID_CALENDAR_FEED_ENTITY_ID_ERROR,
      );
  }
}

const FEED_TYPE_DISPLAY_NAMES: Readonly<Record<CalendarFeedType, string>> = {
  [CALENDAR_FEED_TYPE.ALL]: "All Events",
  [CALENDAR_FEED_TYPE.TEAM]: "Team Schedule",
  [CALENDAR_FEED_TYPE.COMPETITION]: "Competition Schedule",
  [CALENDAR_FEED_TYPE.PLAYER]: "Player Schedule",
};

export function get_feed_type_display_name(
  feed_type: CalendarFeedType,
): string {
  return FEED_TYPE_DISPLAY_NAMES[feed_type];
}
