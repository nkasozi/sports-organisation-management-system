import { FIELD_RULE_KIND, type FieldRule } from "./shared_field_rules_catalog";

export type FieldCheck =
  | { is_valid: true }
  | { is_valid: false; message: string };

export const VALID: FieldCheck = { is_valid: true };

export function invalid(message: string): FieldCheck {
  return { is_valid: false, message };
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const LATEST_YEAR = 2200;
const ONE_DAY_MS = 86_400_000;

function read_calendar_date(value: string): Date | false {
  const match = value.trim().match(DATE_PATTERN);
  if (!match) return false;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const candidate = new Date(Date.UTC(year, month - 1, day));
  const is_real =
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;
  return is_real ? candidate : false;
}

export function check_date(
  label: string,
  value: string,
  rule: Extract<FieldRule, { kind: typeof FIELD_RULE_KIND.DATE }>,
  now_ms: number,
): FieldCheck {
  const parsed = read_calendar_date(value);
  if (parsed === false)
    return invalid(`${label} should be a real date, e.g. 2024-03-15.`);
  const year = parsed.getUTCFullYear();
  if (year < rule.earliest_year)
    return invalid(`${label} can't be before ${rule.earliest_year}.`);
  if (year > LATEST_YEAR)
    return invalid(`${label} can't be after ${LATEST_YEAR}.`);
  if (rule.past_only && parsed.getTime() > now_ms + ONE_DAY_MS)
    return invalid(`${label} can't be in the future.`);
  return VALID;
}

export function check_date_time(label: string, value: string): FieldCheck {
  return read_calendar_date(value) !== false && !Number.isNaN(Date.parse(value))
    ? VALID
    : invalid(`${label} should be a real date and time.`);
}

export function check_time(label: string, value: string): FieldCheck {
  return TIME_PATTERN.test(value.trim())
    ? VALID
    : invalid(`${label} should be a time like 14:30.`);
}
