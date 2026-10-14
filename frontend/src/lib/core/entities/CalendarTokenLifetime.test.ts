import { describe, expect, it } from "vitest";

import type { CalendarToken } from "./CalendarToken";
import { compute_calendar_token_expiry } from "./CalendarToken";
import {
  cap_calendar_token_expiry,
  MAX_CALENDAR_TOKEN_LIFETIME_DAYS,
} from "./CalendarTokenLifetime";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const CREATED_AT = "2026-01-01T00:00:00.000Z";
const CREATED_AT_MILLISECONDS = Date.parse(CREATED_AT);

function days_after_creation(days: number): CalendarToken["expires_at"] {
  return new Date(
    CREATED_AT_MILLISECONDS + days * DAY_MILLISECONDS,
  ).toISOString() as CalendarToken["expires_at"];
}

describe("cap_calendar_token_expiry", () => {
  it("allows at most a 365 day lifetime", () => {
    expect(MAX_CALENDAR_TOKEN_LIFETIME_DAYS).toBe(365);
  });

  it("keeps an expiry inside the maximum lifetime", () => {
    expect(
      cap_calendar_token_expiry({
        expires_at: days_after_creation(90),
        lifetime_started_at: CREATED_AT,
      }),
    ).toBe(days_after_creation(90));
  });

  it("keeps an expiry exactly at the maximum lifetime", () => {
    expect(
      cap_calendar_token_expiry({
        expires_at: days_after_creation(365),
        lifetime_started_at: CREATED_AT,
      }),
    ).toBe(days_after_creation(365));
  });

  it("caps an expiry beyond the maximum lifetime to 365 days after creation", () => {
    expect(
      cap_calendar_token_expiry({
        expires_at: days_after_creation(800),
        lifetime_started_at: CREATED_AT,
      }),
    ).toBe(days_after_creation(365));
  });

  it("measures the lifetime from now when the creation time is unreadable", () => {
    const capped = cap_calendar_token_expiry({
      expires_at: "2999-01-01T00:00:00.000Z" as CalendarToken["expires_at"],
      lifetime_started_at: "",
    });
    const latest_allowed =
      Date.now() + MAX_CALENDAR_TOKEN_LIFETIME_DAYS * DAY_MILLISECONDS;
    expect(Date.parse(capped)).toBeLessThanOrEqual(latest_allowed);
  });
});

describe("compute_calendar_token_expiry", () => {
  it("creates tokens that stay within the maximum lifetime", () => {
    const latest_allowed =
      Date.now() + MAX_CALENDAR_TOKEN_LIFETIME_DAYS * DAY_MILLISECONDS;
    expect(Date.parse(compute_calendar_token_expiry())).toBeLessThanOrEqual(
      latest_allowed,
    );
  });
});
