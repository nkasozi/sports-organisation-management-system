import { WILDCARD_SCOPE } from "../entities/StatusConstants";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "./Result";

type BrandedString<TBrand extends string> = string & {
  readonly __brand: TBrand;
};

type BrandedNumber<TBrand extends string> = number & {
  readonly __brand: TBrand;
};

type ScalarInputValue<TValue> =
  TValue extends BrandedString<string>
    ? string
    : TValue extends BrandedNumber<string>
      ? number
      : TValue extends Array<infer TElement>
        ? Array<ScalarInputValue<TElement>>
        : TValue extends ReadonlyArray<infer TElement>
          ? ReadonlyArray<ScalarInputValue<TElement>>
          : TValue extends object
            ? { [TKey in keyof TValue]: ScalarInputValue<TValue[TKey]> }
            : TValue;

export type CalendarTokenValue = BrandedString<"CalendarTokenValue">;
export type EmailAddress = BrandedString<"EmailAddress">;
export type EntityId = BrandedString<"EntityId">;
export type EntityScope = EntityId | WildcardScope;
export type GameMinute = BrandedNumber<"GameMinute">;
export type IsoDateString = BrandedString<"IsoDateString">;
export type IsoDateTimeString = BrandedString<"IsoDateTimeString">;
export type Name = BrandedString<"Name">;
export type ScalarValueInput<TValue> = ScalarInputValue<TValue>;
export type ScalarInput<TValue> = {
  [TKey in keyof TValue]: ScalarInputValue<TValue[TKey]>;
};
export type WildcardScope = typeof WILDCARD_SCOPE & {
  readonly __brand: "WildcardScope";
};

export type CalendarFeedEntityId = EntityId;

const CALENDAR_TOKEN_VALUE_PATTERN = /^[a-zA-Z0-9_-]{1,255}$/;
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENTITY_ID_PATTERN = /^[a-zA-Z0-9_-]{1,255}$/;
const ISO_DATE_STRING_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}T.+$/;
const MAX_NAME_LENGTH = 255;

const INVALID_CALENDAR_TOKEN_VALUE_ERROR = "Calendar token value is invalid";
const INVALID_DATE_STRING_ERROR = "Date string is invalid";
const INVALID_DATE_TIME_STRING_ERROR = "Date-time string is invalid";
const INVALID_EMAIL_ADDRESS_ERROR = "Email address is invalid";
const INVALID_ENTITY_ID_ERROR = "Entity ID is invalid";
const INVALID_ENTITY_SCOPE_ERROR = "Entity scope is invalid";
const INVALID_GAME_MINUTE_ERROR = "Game minute is invalid";
const INVALID_NAME_ERROR = "Name is invalid";

const DISALLOWED_WILDCARD_VALUES: ReadonlySet<string> = new Set<string>([
  WILDCARD_SCOPE,
]);

function normalize_scalar_input(raw_value: string): string {
  return raw_value.trim();
}

function parse_required_string<TValue extends string>(command: {
  raw_value: string;
  invalid_error: string;
  pattern?: RegExp;
  disallowed_values?: ReadonlySet<string>;
}): Result<TValue> {
  const normalized_value = normalize_scalar_input(command.raw_value);

  if (normalized_value.length === 0) {
    return create_failure_result(command.invalid_error);
  }

  if (command.disallowed_values?.has(normalized_value)) {
    return create_failure_result(command.invalid_error);
  }

  if (command.pattern && !command.pattern.test(normalized_value)) {
    return create_failure_result(command.invalid_error);
  }

  return create_success_result(normalized_value as TValue);
}

function is_valid_iso_date_string(value: string): boolean {
  const match = value.match(ISO_DATE_STRING_PATTERN);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function parse_calendar_token_value(
  raw_value: string,
  invalid_error: string = INVALID_CALENDAR_TOKEN_VALUE_ERROR,
): Result<CalendarTokenValue> {
  return parse_required_string<CalendarTokenValue>({
    raw_value,
    invalid_error,
    pattern: CALENDAR_TOKEN_VALUE_PATTERN,
  });
}

export function parse_email_address(
  raw_value: string,
  invalid_error: string = INVALID_EMAIL_ADDRESS_ERROR,
): Result<EmailAddress> {
  return parse_required_string<EmailAddress>({
    raw_value,
    invalid_error,
    pattern: EMAIL_ADDRESS_PATTERN,
  });
}

export function parse_entity_id(
  raw_value: string,
  invalid_error: string = INVALID_ENTITY_ID_ERROR,
): Result<EntityId> {
  return parse_required_string<EntityId>({
    raw_value,
    invalid_error,
    pattern: ENTITY_ID_PATTERN,
    disallowed_values: DISALLOWED_WILDCARD_VALUES,
  });
}

export function parse_entity_scope(
  raw_value: string,
  invalid_error: string = INVALID_ENTITY_SCOPE_ERROR,
): Result<EntityScope> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (normalized_value === WILDCARD_SCOPE) {
    return create_success_result(WILDCARD_SCOPE as WildcardScope);
  }

  return parse_entity_id(normalized_value, invalid_error);
}

export function parse_game_minute(
  raw_value: number,
  invalid_error: string = INVALID_GAME_MINUTE_ERROR,
): Result<GameMinute> {
  if (!Number.isInteger(raw_value) || raw_value < 0) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(raw_value as GameMinute);
}

export function parse_iso_date_string(
  raw_value: string,
  invalid_error: string = INVALID_DATE_STRING_ERROR,
): Result<IsoDateString> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (!is_valid_iso_date_string(normalized_value)) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as IsoDateString);
}

export function parse_iso_date_time_string(
  raw_value: string,
  invalid_error: string = INVALID_DATE_TIME_STRING_ERROR,
): Result<IsoDateTimeString> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (
    !ISO_DATE_TIME_STRING_PATTERN.test(normalized_value) ||
    Number.isNaN(Date.parse(normalized_value))
  ) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as IsoDateTimeString);
}

export function parse_name(
  raw_value: string,
  invalid_error: string = INVALID_NAME_ERROR,
): Result<Name> {
  const normalized_value = normalize_scalar_input(raw_value);

  if (
    normalized_value.length === 0 ||
    normalized_value.length > MAX_NAME_LENGTH
  ) {
    return create_failure_result(invalid_error);
  }

  return create_success_result(normalized_value as Name);
}
