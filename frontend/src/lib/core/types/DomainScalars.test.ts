import { describe, expect, it } from "vitest";

import {
  type EntityId,
  type GameMinute,
  type IsoDateString,
  type IsoDateTimeString,
  type Name,
  parse_calendar_token_value,
  parse_email_address,
  parse_entity_id,
  parse_entity_scope,
  parse_game_minute,
  parse_iso_date_string,
  parse_iso_date_time_string,
  parse_name,
  type ScalarInput,
} from "./DomainScalars";

describe("DomainScalars", () => {
  it("parses a valid calendar token value", () => {
    const result = parse_calendar_token_value("token_with-valid_123");

    expect(result.success).toBe(true);
  });

  it("rejects an invalid calendar token value", () => {
    const result = parse_calendar_token_value("invalid token value");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Calendar token value is invalid");
  });

  it("rejects wildcard values for concrete entity ids", () => {
    const result = parse_entity_id("*");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Entity ID is invalid");
  });

  it("accepts wildcard scope values", () => {
    const result = parse_entity_scope("*");

    expect(result.success).toBe(true);
  });

  it("parses concrete entity ids, names, and email addresses", () => {
    const entity_id_result = parse_entity_id("user_123");
    const name_result = parse_name("  Admin User  ");
    const email_result = parse_email_address("test@example.com");

    expect(entity_id_result.success).toBe(true);
    expect(name_result.success).toBe(true);
    expect(email_result.success).toBe(true);
  });

  it("parses valid ISO date and date-time strings", () => {
    const date_result = parse_iso_date_string("2026-04-14");
    const date_time_result = parse_iso_date_time_string(
      "2026-04-14T12:30:00.000Z",
    );

    expect(date_result.success).toBe(true);
    expect(date_time_result.success).toBe(true);

    if (date_result.success) {
      const parsed_date: IsoDateString = date_result.data;

      expect(parsed_date).toBe("2026-04-14");
    }

    if (date_time_result.success) {
      const parsed_date_time: IsoDateTimeString = date_time_result.data;

      expect(parsed_date_time).toBe("2026-04-14T12:30:00.000Z");
    }
  });

  it("parses non-negative game minutes", () => {
    const minute_result = parse_game_minute(45);
    const invalid_minute_result = parse_game_minute(-1);

    expect(minute_result.success).toBe(true);
    expect(invalid_minute_result.success).toBe(false);

    if (minute_result.success) {
      const parsed_minute: GameMinute = minute_result.data;

      expect(parsed_minute).toBe(45);
    }
  });

  it("maps branded scalar entity shapes back to raw input primitives", () => {
    type RawTypedEntityInput = ScalarInput<{
      created_at: IsoDateTimeString;
      entity_id: EntityId;
      minute: GameMinute;
      name: Name;
      scheduled_date: IsoDateString;
    }>;

    const input = {
      created_at: "2026-04-14T12:30:00.000Z",
      entity_id: "team_123",
      minute: 45,
      name: "Team Name",
      scheduled_date: "2026-04-14",
    } as RawTypedEntityInput;

    expect(input.entity_id).toBe("team_123");
    expect(input.minute).toBe(45);
  });
});
