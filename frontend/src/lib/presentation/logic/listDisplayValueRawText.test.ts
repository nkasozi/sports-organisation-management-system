import { describe, expect, it } from "vitest";

import { get_display_value_for_entity_field } from "./listDisplayValueLogic";

function display(field_name: string, value: string): string {
  return get_display_value_for_entity_field(
    { id: "record_1", [field_name]: value } as never,
    field_name,
    {},
  );
}

describe("list display of raw text values", () => {
  it("shows emails, websites and slugs exactly as stored", () => {
    expect(display("contact_email", "info@hoima-league.org")).toBe(
      "info@hoima-league.org",
    );
    expect(display("website", "https://www.hoima-league.org")).toBe(
      "https://www.hoima-league.org",
    );
    expect(display("profile_slug", "hoima-eagles-123")).toBe(
      "hoima-eagles-123",
    );
  });

  it("still turns code-style values into readable words", () => {
    expect(display("status", "in_progress")).toBe("In Progress");
    expect(display("status", "active")).toBe("Active");
  });
});
