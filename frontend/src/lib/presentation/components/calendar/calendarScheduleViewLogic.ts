import "temporal-polyfill/global";

import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";

interface ScheduleXCalendarEvent {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime | Temporal.PlainDate;
  end: Temporal.ZonedDateTime | Temporal.PlainDate;
  description: string;
  calendarId: string;
}

const SIGNATURE_SEPARATOR = "|";

function pad_two_digits(value: number): string {
  return String(value).padStart(2, "0");
}

function format_utc_offset(offset_minutes: number): string {
  const offset_hours = Math.floor(Math.abs(offset_minutes) / 60);
  const offset_remaining_minutes = Math.abs(offset_minutes) % 60;
  const offset_sign = offset_minutes >= 0 ? "+" : "-";
  return `${offset_sign}${pad_two_digits(offset_hours)}:${pad_two_digits(offset_remaining_minutes)}`;
}

export function convert_iso_to_zoned_datetime(
  iso_string: string,
): Temporal.ZonedDateTime {
  const date = new Date(iso_string);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const calendar_date = `${date.getFullYear()}-${pad_two_digits(date.getMonth() + 1)}-${pad_two_digits(date.getDate())}`;
  const clock_time = `${pad_two_digits(date.getHours())}:${pad_two_digits(date.getMinutes())}:${pad_two_digits(date.getSeconds())}`;
  const utc_offset = format_utc_offset(-date.getTimezoneOffset());
  return Temporal.ZonedDateTime.from(
    `${calendar_date}T${clock_time}${utc_offset}[${timezone}]`,
  );
}

export function convert_iso_to_plain_date(
  iso_string: string,
): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso_string.split("T")[0]);
}

function convert_event_boundary(
  iso_string: string,
  is_all_day: boolean,
): Temporal.ZonedDateTime | Temporal.PlainDate {
  return is_all_day
    ? convert_iso_to_plain_date(iso_string)
    : convert_iso_to_zoned_datetime(iso_string);
}

export function convert_to_schedule_x_events(
  events: CalendarEvent[],
): ScheduleXCalendarEvent[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: convert_event_boundary(event.start, event.all_day),
    end: convert_event_boundary(event.end, event.all_day),
    description: `${event.category_name} - ${event.activity.description || ""}`,
    calendarId: event.category_type,
  }));
}

export function build_calendar_event_signature(
  calendar_events: CalendarEvent[],
): string {
  return calendar_events
    .map(
      (event) =>
        `${event.id}:${event.start}:${event.end}:${event.category_type}`,
    )
    .join(SIGNATURE_SEPARATOR);
}

export function build_calendar_category_signature(
  categories: ActivityCategory[],
): string {
  return categories
    .map(
      (category) =>
        `${category.id}:${category.color}:${category.category_type}`,
    )
    .join(SIGNATURE_SEPARATOR);
}

export function format_schedule_clock_time(
  date_time: Temporal.ZonedDateTime,
): string {
  return `${pad_two_digits(date_time.hour)}:${pad_two_digits(date_time.minute)}`;
}
