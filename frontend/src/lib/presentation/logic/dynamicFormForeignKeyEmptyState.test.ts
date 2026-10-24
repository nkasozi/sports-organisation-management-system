import { describe, expect, it } from "vitest";

import { build_filtered_foreign_key_empty_message } from "./dynamicFormForeignKeyEmptyState";

describe("build_filtered_foreign_key_empty_message", () => {
  it("says plainly that nothing was found for the field", () => {
    expect(build_filtered_foreign_key_empty_message("Away Team")).toBe(
      "No away team found.",
    );
  });

  it("never mentions recently completed records", () => {
    expect(build_filtered_foreign_key_empty_message("Fixture")).not.toMatch(
      /recently completed/i,
    );
  });
});
