import {
  format_local_calendar_date_key,
  parse_local_calendar_date,
} from "$lib/core/entities/LocalCalendarDate";
import { OptionStatus } from "$lib/core/types/Option";

import { is_blank_string_value } from "./runtimeTypeGuards";

const ISO_DATE_SEGMENT_LENGTH = 10;

export function is_fixture_scheduled_for_different_date(
  scheduled_date: string,
  current_date: Date,
): boolean {
  if (is_blank_string_value(scheduled_date)) return false;

  const normalized_scheduled_date = scheduled_date
    .trim()
    .slice(0, ISO_DATE_SEGMENT_LENGTH);
  const normalized_current_date = format_local_calendar_date_key(current_date);
  return normalized_scheduled_date !== normalized_current_date;
}

export function format_fixture_scheduled_date_label(
  scheduled_date: string,
): string {
  const parsed_date = parse_local_calendar_date(scheduled_date);
  if (parsed_date.status === OptionStatus.NONE) {
    return scheduled_date;
  }

  return parsed_date.value.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
