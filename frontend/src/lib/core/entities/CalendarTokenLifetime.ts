import type { CalendarToken } from "./CalendarToken";

export const MAX_CALENDAR_TOKEN_LIFETIME_DAYS = 365;

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS =
  MAX_CALENDAR_TOKEN_LIFETIME_DAYS * DAY_MILLISECONDS;

interface CalendarTokenExpiryCapCommand {
  expires_at: CalendarToken["expires_at"];
  lifetime_started_at: string;
}

function read_lifetime_start_milliseconds(lifetime_started_at: string): number {
  const started_at = Date.parse(lifetime_started_at);
  return Number.isNaN(started_at) ? Date.now() : started_at;
}

export function cap_calendar_token_expiry(
  command: CalendarTokenExpiryCapCommand,
): CalendarToken["expires_at"] {
  const expiry = Date.parse(command.expires_at);
  const latest_expiry =
    read_lifetime_start_milliseconds(command.lifetime_started_at) +
    MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS;
  if (Number.isNaN(expiry) || expiry <= latest_expiry)
    return command.expires_at;
  return new Date(latest_expiry).toISOString() as CalendarToken["expires_at"];
}
