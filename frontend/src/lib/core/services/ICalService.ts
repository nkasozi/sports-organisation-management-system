import type { Activity } from "../entities/Activity";
import type { Fixture } from "../entities/Fixture";

export interface ICalEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  reminder_minutes_before: number | null;
}

export interface ICalFeedConfig {
  feed_name: string;
  organization_name: string;
  timezone: string;
  reminder_minutes_before: number;
}

function escape_ical_text(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function format_ical_datetime(iso_string: string, is_all_day: boolean): string {
  const date = new Date(iso_string);

  if (is_all_day) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function format_ical_timestamp(): string {
  return format_ical_datetime(new Date().toISOString(), false);
}

function generate_event_block(event: ICalEvent, sequence: number): string {
  const lines: string[] = [];

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${format_ical_timestamp()}`);
  lines.push(`SEQUENCE:${sequence}`);

  if (event.is_all_day) {
    lines.push(
      `DTSTART;VALUE=DATE:${format_ical_datetime(event.start_datetime, true)}`,
    );
    lines.push(
      `DTEND;VALUE=DATE:${format_ical_datetime(event.end_datetime, true)}`,
    );
  } else {
    lines.push(`DTSTART:${format_ical_datetime(event.start_datetime, false)}`);
    lines.push(`DTEND:${format_ical_datetime(event.end_datetime, false)}`);
  }

  lines.push(`SUMMARY:${escape_ical_text(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escape_ical_text(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escape_ical_text(event.location)}`);
  }

  if (
    event.reminder_minutes_before !== null &&
    event.reminder_minutes_before > 0
  ) {
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:Reminder: ${escape_ical_text(event.title)}`);
    lines.push(`TRIGGER:-PT${event.reminder_minutes_before}M`);
    lines.push("END:VALARM");
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

export function generate_ical_feed(
  events: ICalEvent[],
  config: ICalFeedConfig,
): string {
  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`PRODID:-//${config.organization_name}//Sports Calendar//EN`);
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escape_ical_text(config.feed_name)}`);
  lines.push(`X-WR-TIMEZONE:${config.timezone}`);
  lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
  lines.push("X-PUBLISHED-TTL:PT1H");

  for (let i = 0; i < events.length; i++) {
    const event_with_reminder: ICalEvent = {
      ...events[i],
      reminder_minutes_before:
        events[i].reminder_minutes_before ?? config.reminder_minutes_before,
    };
    lines.push(generate_event_block(event_with_reminder, i + 1));
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}

export function convert_activity_to_ical_event(
  activity: Activity,
  organization_name: string,
): ICalEvent {
  return {
    uid: `activity-${activity.id}@${organization_name.toLowerCase().replace(/\s+/g, "-")}`,
    title: activity.title,
    description: activity.description || activity.notes || "",
    location: activity.location || "",
    start_datetime: activity.start_datetime,
    end_datetime: activity.end_datetime,
    is_all_day: activity.is_all_day,
    reminder_minutes_before: get_activity_reminder_minutes(activity),
  };
}

function get_activity_reminder_minutes(activity: Activity): number | null {
  const enabled_reminder = activity.reminders.find((r) => r.is_enabled);
  return enabled_reminder?.minutes_before ?? null;
}

export function convert_fixture_to_ical_event(
  fixture: Fixture,
  home_team_name: string,
  away_team_name: string,
  competition_name: string,
  organization_name: string,
  default_reminder_minutes: number,
): ICalEvent {
  const title = `${home_team_name} vs ${away_team_name}`;
  const scheduled_datetime = `${fixture.scheduled_date}T${fixture.scheduled_time}:00`;
  const start = new Date(scheduled_datetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const description_parts: string[] = [];
  description_parts.push(`Competition: ${competition_name}`);
  description_parts.push(`Round: ${fixture.round_name}`);
  if (fixture.venue) {
    description_parts.push(`Venue: ${fixture.venue}`);
  }
  if (fixture.notes) {
    description_parts.push(`Notes: ${fixture.notes}`);
  }

  return {
    uid: `fixture-${fixture.id}@${organization_name.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    description: description_parts.join("\n"),
    location: fixture.venue || "",
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    is_all_day: false,
    reminder_minutes_before: default_reminder_minutes,
  };
}
