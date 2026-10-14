import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_INDEX_OFFSET = 1;
const DATE_PART_WIDTH = 2;
const YEAR_PART_WIDTH = 4;
const PAD_CHARACTER = "0";
const DATE_KEY_SEPARATOR = "-";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function pad_date_part(value: number, width: number): string {
  return String(value).padStart(width, PAD_CHARACTER);
}

export function parse_local_calendar_date(value: string): Option<Date> {
  const match = CALENDAR_DATE_PATTERN.exec(String(value ?? "").trim());
  if (!match) return create_none_option();
  const year = Number(match[1]);
  const month_index = Number(match[2]) - MONTH_INDEX_OFFSET;
  const day = Number(match[3]);
  const local_date = new Date(year, month_index, day);
  const is_same_calendar_day =
    local_date.getFullYear() === year &&
    local_date.getMonth() === month_index &&
    local_date.getDate() === day;
  return is_same_calendar_day
    ? create_some_option(local_date)
    : create_none_option();
}

export function format_local_calendar_date_key(date: Date): string {
  return [
    pad_date_part(date.getFullYear(), YEAR_PART_WIDTH),
    pad_date_part(date.getMonth() + MONTH_INDEX_OFFSET, DATE_PART_WIDTH),
    pad_date_part(date.getDate(), DATE_PART_WIDTH),
  ].join(DATE_KEY_SEPARATOR);
}

export function read_local_calendar_date_key(value: string): Option<string> {
  const parsed = parse_local_calendar_date(value);
  return parsed.status === OptionStatus.SOME
    ? create_some_option(format_local_calendar_date_key(parsed.value))
    : create_none_option();
}

export function compare_local_calendar_dates(
  left_key: string,
  right_key: string,
): number {
  if (left_key === right_key) return 0;
  return left_key < right_key ? -1 : 1;
}

export function is_local_calendar_date_before(
  value: string,
  reference_date: Date,
): boolean {
  const key = read_local_calendar_date_key(value);
  if (key.status === OptionStatus.NONE) return false;
  return (
    compare_local_calendar_dates(
      key.value,
      format_local_calendar_date_key(reference_date),
    ) < 0
  );
}

export function count_local_calendar_days_between(
  from_date: Date,
  to_date: Date,
): number {
  const from_midnight = new Date(
    from_date.getFullYear(),
    from_date.getMonth(),
    from_date.getDate(),
  );
  const to_midnight = new Date(
    to_date.getFullYear(),
    to_date.getMonth(),
    to_date.getDate(),
  );
  return Math.round(
    (to_midnight.getTime() - from_midnight.getTime()) / MILLISECONDS_PER_DAY,
  );
}
