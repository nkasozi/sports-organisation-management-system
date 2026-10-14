import { describe, expect, it } from "vitest";

import {
  cap_calendar_token_expiry,
  is_calendar_token_expired,
  MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS,
} from "./calendar_token_lifetime";
import { create_none_option, create_some_option } from "./option";

const NOW_MILLISECONDS = Date.parse("2026-03-01T00:00:00.000Z");
const FIVE_YEARS_LATER = "2031-03-01T00:00:00.000Z";

function cap(
  record_data: Record<string, unknown>,
  existing_creation_time: number,
): Record<string, unknown> {
  return cap_calendar_token_expiry({
    table_name: "calendar_tokens",
    local_id: "tok",
    record_data,
    existing_record:
      existing_creation_time > 0
        ? create_some_option({ _creationTime: existing_creation_time })
        : create_none_option(),
    now_milliseconds: NOW_MILLISECONDS,
  });
}

describe("calendar token lifetime", () => {
  it("caps a new token's expiry to the maximum lifetime from now", () => {
    const capped = cap({ expires_at: FIVE_YEARS_LATER }, 0);
    expect(Date.parse(String(capped.expires_at))).toBe(
      NOW_MILLISECONDS + MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS,
    );
  });

  it("caps an updated token's expiry to the maximum lifetime from its creation", () => {
    const created = NOW_MILLISECONDS - MAX_CALENDAR_TOKEN_LIFETIME_MILLISECONDS;
    const capped = cap({ expires_at: FIVE_YEARS_LATER }, created);
    expect(Date.parse(String(capped.expires_at))).toBe(NOW_MILLISECONDS);
  });

  it("leaves a shorter expiry and other tables untouched", () => {
    const short_expiry = { expires_at: "2026-06-01T00:00:00.000Z" };
    expect(cap(short_expiry, 0)).toEqual(short_expiry);
    expect(
      cap_calendar_token_expiry({
        table_name: "teams",
        local_id: "team",
        record_data: { expires_at: FIVE_YEARS_LATER },
        existing_record: create_none_option(),
        now_milliseconds: NOW_MILLISECONDS,
      }),
    ).toEqual({ expires_at: FIVE_YEARS_LATER });
  });

  it("treats a token without a server creation time as expired", () => {
    expect(
      is_calendar_token_expired(
        { expires_at: "2026-06-01T00:00:00.000Z" },
        NOW_MILLISECONDS,
      ),
    ).toBe(true);
  });
});
