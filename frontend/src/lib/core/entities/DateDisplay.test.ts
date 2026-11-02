import { describe, expect, it } from "vitest";

import { format_display_date } from "./DateDisplay";

describe("date display fallbacks", () => {
  it.each(["", "   ", "not-a-date", "2026-02-30", "2026-13-01"])(
    "does not display an invalid or invented date for %j",
    (value) => expect(format_display_date(value)).toBe("Date not recorded"),
  );
  it("preserves a date-only calendar day in western time zones", () => {
    const original_timezone = process.env.TZ;
    try {
      process.env.TZ = "America/Los_Angeles";
      expect(
        format_display_date("2026-11-01", "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      ).toBe("Nov 1, 2026");
    } finally {
      process.env.TZ = original_timezone;
    }
  });
  it("supports context-specific missing labels", () => {
    expect(format_display_date("", void 0, void 0, "Not recorded")).toBe(
      "Not recorded",
    );
  });
});
