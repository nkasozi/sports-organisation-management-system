import { describe, expect, it } from "vitest";

import {
  format_fixture_scheduled_date_label,
  is_fixture_scheduled_for_different_date,
} from "./liveGameStartConfirmation";

describe("liveGameStartConfirmation", () => {
  describe("is_fixture_scheduled_for_different_date", () => {
    it("returns false when scheduled date matches current date", () => {
      const result = is_fixture_scheduled_for_different_date(
        "2026-04-07",
        new Date("2026-04-07T11:30:00"),
      );

      expect(result).toBe(false);
    });

    it("returns true when scheduled date differs from current date", () => {
      const result = is_fixture_scheduled_for_different_date(
        "2026-04-06",
        new Date("2026-04-07T11:30:00"),
      );

      expect(result).toBe(true);
    });

    it("returns false for empty scheduled date", () => {
      const result = is_fixture_scheduled_for_different_date(
        "",
        new Date("2026-04-07T11:30:00"),
      );

      expect(result).toBe(false);
    });

    it("uses only the date segment when a timestamp-like value is provided", () => {
      const result = is_fixture_scheduled_for_different_date(
        "2026-04-07T18:45:00Z",
        new Date("2026-04-07T11:30:00"),
      );

      expect(result).toBe(false);
    });
  });

  describe("format_fixture_scheduled_date_label", () => {
    it("formats a valid scheduled date into a readable label", () => {
      const result = format_fixture_scheduled_date_label("2026-04-07");

      expect(result).toContain("2026");
      expect(result).toContain("April");
      expect(result).toContain("7");
    });

    it("returns the original value for an invalid date", () => {
      const result = format_fixture_scheduled_date_label("not-a-date");

      expect(result).toBe("not-a-date");
    });
  });
});
