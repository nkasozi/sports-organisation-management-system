import { describe, expect, it } from "vitest";

import type {
  CalendarToken,
  UpdateCalendarTokenInput,
} from "../../core/entities/CalendarToken";
import { InBrowserCalendarTokenRepository } from "./InBrowserCalendarTokenRepository";

class TestCalendarTokenRepository extends InBrowserCalendarTokenRepository {
  expose_apply_updates_to_entity(
    entity: CalendarToken,
    updates: UpdateCalendarTokenInput,
  ): CalendarToken {
    return this.apply_updates_to_entity(entity, updates);
  }
}

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const ONE_YEAR_AFTER_CREATION = "2027-01-01T00:00:00.000Z";

function create_token(): CalendarToken {
  return {
    id: "calendar_token_1",
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    token: "token_value",
    user_id: "user_1",
    organization_id: "organization_1",
    feed_type: "all",
    entity_id: "",
    entity_name: "",
    reminder_minutes_before: 60,
    is_active: true,
    last_accessed_at: "",
    access_count: 0,
    expires_at: "2026-04-01T00:00:00.000Z",
  } as unknown as CalendarToken;
}

describe("InBrowserCalendarTokenRepository expiry updates", () => {
  it("caps an extended expiry at 365 days after the token was created", () => {
    const repository = new TestCalendarTokenRepository();

    const updated = repository.expose_apply_updates_to_entity(create_token(), {
      expires_at: "2030-01-01T00:00:00.000Z" as CalendarToken["expires_at"],
    });

    expect(updated.expires_at).toBe(ONE_YEAR_AFTER_CREATION);
  });

  it("keeps the existing expiry when an update leaves it unchanged", () => {
    const repository = new TestCalendarTokenRepository();

    const updated = repository.expose_apply_updates_to_entity(create_token(), {
      is_active: false,
    });

    expect(updated.expires_at).toBe("2026-04-01T00:00:00.000Z");
    expect(updated.is_active).toBe(false);
  });
});
