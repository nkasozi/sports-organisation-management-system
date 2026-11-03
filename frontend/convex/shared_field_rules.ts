import {
  EMAIL_MAXIMUM_LENGTH,
  FIELD_LABELS,
  FIELD_RULE_KIND,
  type FieldRule,
  ORDERED_DATE_FIELD_PAIRS,
  resolve_field_rule,
} from "./shared_field_rules_catalog";
import {
  check_date,
  check_date_time,
  check_time,
  type FieldCheck,
  invalid,
  VALID,
} from "./shared_field_rules_dates";

type FieldErrors = Record<string, string>;

const FIELD_RULE_FAILURE_PREFIX = "Please check your entries:";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS_PATTERN = /^\+?[0-9\s().-]+$/;
const PHONE_MINIMUM_DIGITS = 7;
const PHONE_MAXIMUM_DIGITS = 15;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const STRING_TYPE = "string";

function describe_field_name(field_name: string): string {
  const known_label = FIELD_LABELS[field_name];
  if (known_label) return known_label;
  const words = field_name.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function is_blank(value: unknown): boolean {
  return (
    value === void 0 ||
    value === null ||
    (typeof value === STRING_TYPE && String(value).trim().length === 0)
  );
}

function check_text(label: string, value: string, maximum: number): FieldCheck {
  const length = value.trim().length;
  return length > maximum
    ? invalid(
        `${label} can be at most ${maximum} characters (it has ${length}).`,
      )
    : VALID;
}

function check_email(label: string, value: string): FieldCheck {
  const trimmed = value.trim();
  if (trimmed.length > EMAIL_MAXIMUM_LENGTH)
    return check_text(label, trimmed, EMAIL_MAXIMUM_LENGTH);
  return EMAIL_PATTERN.test(trimmed)
    ? VALID
    : invalid(
        `${label} doesn't look like an email address, e.g. name@example.com.`,
      );
}

function check_phone(label: string, value: string): FieldCheck {
  const digit_count = value.replace(/\D/g, "").length;
  const looks_right =
    PHONE_CHARACTERS_PATTERN.test(value.trim()) &&
    digit_count >= PHONE_MINIMUM_DIGITS &&
    digit_count <= PHONE_MAXIMUM_DIGITS;
  return looks_right
    ? VALID
    : invalid(
        `${label} should be a phone number with ${PHONE_MINIMUM_DIGITS} to ${PHONE_MAXIMUM_DIGITS} digits, e.g. +256 700 123456.`,
      );
}

function check_hex_color(label: string, value: string): FieldCheck {
  return HEX_COLOR_PATTERN.test(value.trim())
    ? VALID
    : invalid(`${label} should be a colour code like #1E40AF.`);
}

function check_number(
  label: string,
  value: unknown,
  rule: Extract<FieldRule, { kind: typeof FIELD_RULE_KIND.NUMBER }>,
): FieldCheck {
  const number_value = Number(value);
  if (!Number.isFinite(number_value))
    return invalid(`${label} must be a number.`);
  if (rule.whole && !Number.isInteger(number_value))
    return invalid(`${label} must be a whole number.`);
  return number_value < rule.minimum || number_value > rule.maximum
    ? invalid(`${label} must be between ${rule.minimum} and ${rule.maximum}.`)
    : VALID;
}

function check_string_rule(
  label: string,
  value: string,
  rule: FieldRule,
  now_ms: number,
): FieldCheck {
  switch (rule.kind) {
    case FIELD_RULE_KIND.TEXT:
      return check_text(label, value, rule.maximum_length);
    case FIELD_RULE_KIND.EMAIL:
      return check_email(label, value);
    case FIELD_RULE_KIND.PHONE:
      return check_phone(label, value);
    case FIELD_RULE_KIND.HEX_COLOR:
      return check_hex_color(label, value);
    case FIELD_RULE_KIND.DATE:
      return check_date(label, value, rule, now_ms);
    case FIELD_RULE_KIND.DATE_TIME:
      return check_date_time(label, value);
    case FIELD_RULE_KIND.TIME:
      return check_time(label, value);
    case FIELD_RULE_KIND.NUMBER:
      return check_number(label, value, rule);
    case FIELD_RULE_KIND.UNCHECKED:
      return VALID;
  }
}

export function check_field_value(
  field_name: string,
  value: unknown,
  now_ms: number,
  label: string = describe_field_name(field_name),
): FieldCheck {
  if (is_blank(value)) return VALID;
  const rule = resolve_field_rule(field_name);
  if (rule.kind === FIELD_RULE_KIND.NUMBER)
    return check_number(label, value, rule);
  if (typeof value !== STRING_TYPE) return VALID;
  return check_string_rule(label, String(value), rule, now_ms);
}

function find_date_order_errors(record: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [start_field, end_field] of ORDERED_DATE_FIELD_PAIRS) {
    const start = record[start_field];
    const end = record[end_field];
    if (typeof start !== STRING_TYPE || typeof end !== STRING_TYPE) continue;
    const start_ms = Date.parse(String(start));
    const end_ms = Date.parse(String(end));
    if (Number.isNaN(start_ms) || Number.isNaN(end_ms) || end_ms >= start_ms)
      continue;
    errors[end_field] =
      `${describe_field_name(end_field)} can't be before the ${describe_field_name(start_field).toLowerCase()}.`;
  }
  return errors;
}

export function find_record_field_errors(
  record: Record<string, unknown>,
  now_ms: number,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field_name, value] of Object.entries(record)) {
    const check = check_field_value(field_name, value, now_ms);
    if (!check.is_valid) errors[field_name] = check.message;
  }
  return { ...find_date_order_errors(record), ...errors };
}

export function describe_field_errors(errors: FieldErrors): string {
  return `${FIELD_RULE_FAILURE_PREFIX} ${Object.values(errors).join(" ")}`;
}

export function is_field_rule_failure_message(message: string): boolean {
  return message.startsWith(FIELD_RULE_FAILURE_PREFIX);
}
