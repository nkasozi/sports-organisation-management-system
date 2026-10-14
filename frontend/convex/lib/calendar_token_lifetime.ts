import { type Option, OptionStatus } from "./option";
import { is_number, is_string } from "./value_guards";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_CALENDAR_TOKEN_LIFETIME_DAYS = 365;
export const MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS =
  MAX_CALENDAR_TOKEN_LIFETIME_DAYS * DAY_MILLISECONDS;
const CALENDAR_TOKENS_TABLE_NAME = "calendar_tokens";
const EXPIRES_AT_FIELD_NAME = "expires_at";
const CREATION_TIME_FIELD_NAME = "_creationTime";
const EXPIRY_CAPPED_EVENT = "calendar_token_expiry_capped";

function read_expiry_milliseconds(record: Record<string, unknown>): number {
  const expires_at = record[EXPIRES_AT_FIELD_NAME];
  return is_string(expires_at) ? Date.parse(expires_at) : Number.NaN;
}

function read_creation_time(record: Record<string, unknown>): Option<number> {
  const creation_time = record[CREATION_TIME_FIELD_NAME];
  return is_number(creation_time)
    ? { status: OptionStatus.SOME, value: creation_time }
    : { status: OptionStatus.NONE };
}

export function is_calendar_token_expired(
  record: Record<string, unknown>,
  now_milliseconds: number,
): boolean {
  const expiry = read_expiry_milliseconds(record);
  const creation_time = read_creation_time(record);
  if (Number.isNaN(expiry)) return true;
  if (creation_time.status === OptionStatus.NONE) return true;
  if (expiry > creation_time.value + MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS)
    return true;
  return expiry <= now_milliseconds;
}

interface CalendarTokenExpiryCapCommand {
  table_name: string;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
  now_milliseconds: number;
}

function read_lifetime_start(command: CalendarTokenExpiryCapCommand): number {
  if (command.existing_record.status === OptionStatus.NONE)
    return command.now_milliseconds;
  const creation_time = read_creation_time(command.existing_record.value);
  return creation_time.status === OptionStatus.SOME
    ? creation_time.value
    : command.now_milliseconds;
}

export function cap_calendar_token_expiry(
  command: CalendarTokenExpiryCapCommand,
): Record<string, unknown> {
  if (command.table_name !== CALENDAR_TOKENS_TABLE_NAME)
    return command.record_data;
  const expiry = read_expiry_milliseconds(command.record_data);
  const latest_expiry =
    read_lifetime_start(command) + MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS;
  if (Number.isNaN(expiry) || expiry <= latest_expiry)
    return command.record_data;
  console.warn("[CalendarTokenLifetime] Token expiry capped", {
    event: EXPIRY_CAPPED_EVENT,
    local_id: command.local_id,
    max_lifetime_days: MAX_CALENDAR_TOKEN_LIFETIME_DAYS,
  });
  return {
    ...command.record_data,
    [EXPIRES_AT_FIELD_NAME]: new Date(latest_expiry).toISOString(),
  };
}
