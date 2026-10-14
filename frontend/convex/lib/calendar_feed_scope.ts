import { is_calendar_token_expired } from "./calendar_token_lifetime";
import { type Option, OptionStatus } from "./option";
import {
  is_number,
  is_object_record,
  is_string,
  read_string_or,
} from "./value_guards";

export const CalendarFeedType = {
  ALL: "all",
  TEAM: "team",
  COMPETITION: "competition",
  PLAYER: "player",
} as const;

type CalendarFeedTypeValue =
  (typeof CalendarFeedType)[keyof typeof CalendarFeedType];

export const CalendarFeedStatus = {
  GRANTED: "granted",
  NOT_FOUND: "not_found",
  EXPIRED: "expired",
} as const;

export interface CalendarFeedToken {
  organization_id: string;
  feed_type: CalendarFeedTypeValue;
  entity_id: string;
  entity_name: string;
  reminder_minutes_before: number;
}

export interface CalendarFeedEvent {
  local_id: string;
  title: string;
  description: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  reminder_minutes_before: number;
}

export type CalendarFeedLookup =
  | {
      status: typeof CalendarFeedStatus.GRANTED;
      feed: CalendarFeedToken & {
        organization_name: string;
        events: CalendarFeedEvent[];
      };
    }
  | { status: typeof CalendarFeedStatus.NOT_FOUND }
  | { status: typeof CalendarFeedStatus.EXPIRED };

type TokenAccess =
  | { status: typeof CalendarFeedStatus.GRANTED; token: CalendarFeedToken }
  | { status: typeof CalendarFeedStatus.NOT_FOUND }
  | { status: typeof CalendarFeedStatus.EXPIRED };

const EMPTY_TEXT = "";
const DEFAULT_REMINDER_MINUTES = 0;
const FEED_TYPES: readonly string[] = Object.values(CalendarFeedType);

function read_text(
  record: Record<string, unknown>,
  field_name: string,
): string {
  return read_string_or(record[field_name], EMPTY_TEXT).trim();
}

function read_feed_type(value: string): Option<CalendarFeedTypeValue> {
  return FEED_TYPES.includes(value)
    ? { status: OptionStatus.SOME, value: value as CalendarFeedTypeValue }
    : { status: OptionStatus.NONE };
}

export function classify_calendar_token(
  stored_token: Option<Record<string, unknown>>,
  now_milliseconds: number,
): TokenAccess {
  if (stored_token.status === OptionStatus.NONE)
    return { status: CalendarFeedStatus.NOT_FOUND };
  const record = stored_token.value;
  const feed_type = read_feed_type(read_text(record, "feed_type"));
  const organization_id = read_text(record, "organization_id");
  if (
    record.is_active !== true ||
    feed_type.status === OptionStatus.NONE ||
    !organization_id
  )
    return { status: CalendarFeedStatus.NOT_FOUND };
  if (is_calendar_token_expired(record, now_milliseconds))
    return { status: CalendarFeedStatus.EXPIRED };
  return {
    status: CalendarFeedStatus.GRANTED,
    token: {
      organization_id,
      feed_type: feed_type.value,
      entity_id: read_text(record, "entity_id"),
      entity_name: read_text(record, "entity_name"),
      reminder_minutes_before: is_number(record.reminder_minutes_before)
        ? record.reminder_minutes_before
        : DEFAULT_REMINDER_MINUTES,
    },
  };
}

function read_team_ids(activity: Record<string, unknown>): string[] {
  const team_ids = activity.team_ids;
  return Array.isArray(team_ids)
    ? team_ids.filter((team_id): team_id is string => is_string(team_id))
    : [];
}

export function select_feed_activities(
  token: CalendarFeedToken,
  activities: Array<Record<string, unknown>>,
  feed_team_ids: ReadonlySet<string>,
): Array<Record<string, unknown>> {
  switch (token.feed_type) {
    case CalendarFeedType.ALL:
      return activities;
    case CalendarFeedType.COMPETITION:
      return token.entity_id
        ? activities.filter(
            (activity) =>
              read_text(activity, "competition_id") === token.entity_id,
          )
        : [];
    case CalendarFeedType.TEAM:
    case CalendarFeedType.PLAYER:
      return activities.filter((activity) =>
        read_team_ids(activity).some((team_id) => feed_team_ids.has(team_id)),
      );
  }
}

function read_enabled_reminder_minutes(
  activity: Record<string, unknown>,
): number {
  const reminders = Array.isArray(activity.reminders) ? activity.reminders : [];
  const enabled = reminders.find(
    (reminder) => is_object_record(reminder) && reminder.is_enabled === true,
  );
  return is_object_record(enabled) && is_number(enabled.minutes_before)
    ? enabled.minutes_before
    : DEFAULT_REMINDER_MINUTES;
}

export function to_calendar_feed_event(
  activity: Record<string, unknown>,
): CalendarFeedEvent {
  return {
    local_id: read_text(activity, "local_id"),
    title: read_text(activity, "title"),
    description: read_text(activity, "description"),
    location: read_text(activity, "location"),
    start_datetime: read_text(activity, "start_datetime"),
    end_datetime: read_text(activity, "end_datetime"),
    is_all_day: activity.is_all_day === true,
    reminder_minutes_before: read_enabled_reminder_minutes(activity),
  };
}
