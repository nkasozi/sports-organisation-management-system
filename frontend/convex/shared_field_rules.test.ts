import { describe, expect, it } from "vitest";

import {
  check_field_value,
  describe_field_errors,
  find_record_field_errors,
  is_field_rule_failure_message,
} from "./shared_field_rules";

const NOW_MS = Date.UTC(2026, 10, 3, 12);

function message_for(field_name: string, value: unknown): string {
  const check = check_field_value(field_name, value, NOW_MS);
  return check.is_valid ? "" : check.message;
}

describe("fields that are left empty", () => {
  it("are never judged, so nothing becomes required", () => {
    for (const value of ["", "   ", undefined, null])
      expect(check_field_value("phone", value, NOW_MS).is_valid).toBe(true);
  });
});

describe("text length", () => {
  it("caps names, descriptions and any other text", () => {
    expect(message_for("first_name", "a".repeat(100))).toBe("");
    expect(message_for("first_name", "a".repeat(101))).toBe(
      "First name can be at most 100 characters (it has 101).",
    );
    expect(message_for("description", "a".repeat(1_001))).toMatch(/1000/);
    expect(message_for("team_name", "a".repeat(151))).toMatch(/150/);
    expect(message_for("anything_else", "a".repeat(5_001))).toMatch(/5000/);
  });

  it("leaves ids, links and timestamps to their own checks", () => {
    for (const field_name of ["organization_id", "logo_url", "created_at"])
      expect(message_for(field_name, "a".repeat(10_000))).toBe("");
  });
});

describe("formats", () => {
  it("checks email addresses", () => {
    expect(message_for("email", "coach@club.ug")).toBe("");
    expect(message_for("contact_email", "coach@club")).toMatch(/email address/);
  });

  it("checks phone numbers", () => {
    for (const phone of ["+256 700 123456", "(041) 434-5678", "0772123456"])
      expect(message_for("phone", phone)).toBe("");
    for (const phone of ["12345", "call me", "+256 700 123 456 789 01"])
      expect(message_for("emergency_contact_phone", phone)).toMatch(/digits/);
  });

  it("checks colour codes", () => {
    expect(message_for("main_color", "#1E40AF")).toBe("");
    expect(message_for("primary_color", "blue")).toMatch(/#1E40AF/);
  });

  it("checks dates, times and date-times", () => {
    expect(message_for("start_date", "2026-02-28")).toBe("");
    expect(message_for("start_date", "2026-02-30")).toMatch(/real date/);
    expect(message_for("registration_date", "2026-01-15T00:00:00.000Z")).toBe(
      "",
    );
    expect(message_for("scheduled_time", "15:00")).toBe("");
    expect(message_for("scheduled_time", "25:00")).toMatch(/14:30/);
    expect(message_for("start_datetime", "2024-03-10T08:00:00.000Z")).toBe("");
    expect(message_for("start_datetime", "next week")).toMatch(/date and time/);
  });

  it("keeps birth dates in a believable range", () => {
    expect(message_for("date_of_birth", "2001-07-04")).toBe("");
    expect(message_for("date_of_birth", "2030-01-01")).toBe(
      "Date of birth can't be in the future.",
    );
    expect(message_for("date_of_birth", "1850-01-01")).toMatch(/1900/);
  });
});

describe("numbers", () => {
  it("keeps numbers whole and within range, typed or as text", () => {
    expect(message_for("jersey_number", 10)).toBe("");
    expect(message_for("jersey_number", "10")).toBe("");
    expect(message_for("jersey_number", 100)).toBe(
      "Jersey number must be between 0 and 99.",
    );
    expect(message_for("jersey_number", 7.5)).toMatch(/whole number/);
    expect(message_for("height_cm", "abc")).toMatch(/must be a number/);
    expect(message_for("entry_fee", 25.5)).toBe("");
  });
});

describe("whole records", () => {
  it("reports every bad field and dates out of order", () => {
    const errors = find_record_field_errors(
      {
        first_name: "Grace",
        phone: "12",
        start_date: "2026-05-01",
        end_date: "2026-04-01",
      },
      NOW_MS,
    );
    expect(Object.keys(errors).sort()).toEqual(["end_date", "phone"]);
    expect(errors.end_date).toBe("End date can't be before the start date.");
  });

  it("marks a combined message so it can be shown as is", () => {
    const message = describe_field_errors({ phone: "Phone is wrong." });
    expect(is_field_rule_failure_message(message)).toBe(true);
    expect(is_field_rule_failure_message("Could not save")).toBe(false);
  });
});
