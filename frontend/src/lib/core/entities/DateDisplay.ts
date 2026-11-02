import { OptionStatus } from "../types/Option";
import { parse_local_calendar_date } from "./LocalCalendarDate";

export const MISSING_DATE_LABEL = "Date not recorded";

export function format_display_date(
  value: string,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = MISSING_DATE_LABEL,
): string {
  const text = value.trim();
  if (!text) return fallback;
  const calendar_date = parse_local_calendar_date(text);
  const date_only = /^\d{4}-\d{2}-\d{2}$/.test(text);
  if (
    /^\d{4}-\d{2}-\d{2}/.test(text) &&
    calendar_date.status === OptionStatus.NONE
  )
    return fallback;
  const date =
    date_only && calendar_date.status === OptionStatus.SOME
      ? calendar_date.value
      : new Date(text);
  if (!Number.isFinite(date.getTime())) return fallback;
  return date.toLocaleDateString(locales, options);
}
