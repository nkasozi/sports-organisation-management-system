import type {
  CalendarFeedEvent,
  CalendarFeedLookup,
} from "$convex/lib/calendar_feed_scope";
import {
  CALENDAR_FEED_TYPE,
  get_feed_type_display_name,
} from "$lib/core/entities/CalendarToken";
import {
  generate_ical_feed,
  type ICalEvent,
  type ICalFeedConfig,
} from "$lib/core/services/ICalService";

type GrantedCalendarFeed = Extract<
  CalendarFeedLookup,
  { status: "granted" }
>["feed"];

const CALENDAR_FEED_TIMEZONE = "UTC";
const PLAIN_TEXT_CONTENT_TYPE = "text/plain";
const ICS_FILE_EXTENSION_PATTERN = /\.ics$/;
const NON_ALPHANUMERIC_PATTERN = /[^a-zA-Z0-9]/g;
const WHITESPACE_PATTERN = /\s+/g;
const UID_DOMAIN_SEPARATOR = "-";
const HTTP_OK_STATUS = 200;

export function strip_calendar_token_extension(
  token_with_extension: string,
): string {
  return token_with_extension.replace(ICS_FILE_EXTENSION_PATTERN, "");
}

export function create_plain_text_response(
  message: string,
  status: number,
): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": PLAIN_TEXT_CONTENT_TYPE },
  });
}

function build_uid_domain(organization_name: string): string {
  return organization_name
    .toLowerCase()
    .replace(WHITESPACE_PATTERN, UID_DOMAIN_SEPARATOR);
}

function convert_feed_event_to_ical_event(
  event: CalendarFeedEvent,
  organization_name: string,
): ICalEvent {
  return {
    uid: `activity-${event.local_id}@${build_uid_domain(organization_name)}`,
    title: event.title,
    description: event.description,
    location: event.location,
    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    is_all_day: event.is_all_day,
    reminder_minutes_before: event.reminder_minutes_before,
  };
}

function build_calendar_feed_name(feed: GrantedCalendarFeed): string {
  if (feed.feed_type === CALENDAR_FEED_TYPE.ALL) {
    return `${feed.organization_name} Calendar`;
  }
  const type_display = get_feed_type_display_name(feed.feed_type);
  return feed.entity_name
    ? `${feed.entity_name} - ${type_display}`
    : `${feed.organization_name} ${type_display}`;
}

function create_calendar_feed_response(
  ics_content: string,
  feed_name: string,
): Response {
  return new Response(ics_content, {
    status: HTTP_OK_STATUS,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${feed_name.replace(NON_ALPHANUMERIC_PATTERN, "_")}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export function build_calendar_feed_ics_response(
  feed: GrantedCalendarFeed,
): Response {
  const ical_events = feed.events.map((event) =>
    convert_feed_event_to_ical_event(event, feed.organization_name),
  );
  const feed_name = build_calendar_feed_name(feed);
  const config: ICalFeedConfig = {
    feed_name,
    organization_name: feed.organization_name,
    timezone: CALENDAR_FEED_TIMEZONE,
    reminder_minutes_before: feed.reminder_minutes_before,
  };
  return create_calendar_feed_response(
    generate_ical_feed(ical_events, config),
    feed_name,
  );
}
