import { describe, expect, it } from "vitest";

import {
  check_minimum_text_length,
  check_optional_email_address,
  check_required_name,
  is_blank_text,
} from "./EntityValidation";

const MISSING_FORM_VALUE = undefined as unknown as string;

describe("entity validation helpers with values missing at runtime", () => {
  it("accepts a missing optional email", () => {
    expect(
      check_optional_email_address(MISSING_FORM_VALUE, "bad email"),
    ).toEqual({
      success: true,
      data: true,
    });
  });

  it("still validates a provided optional email", () => {
    expect(check_optional_email_address("not-an-email", "bad email")).toEqual({
      success: false,
      error: "bad email",
    });
  });

  it("treats a missing required name as invalid instead of crashing", () => {
    expect(check_required_name(MISSING_FORM_VALUE, "name required")).toEqual({
      success: false,
      error: "name required",
    });
  });

  it("treats missing text as blank and too short", () => {
    expect(is_blank_text(MISSING_FORM_VALUE)).toBe(true);
    expect(check_minimum_text_length(MISSING_FORM_VALUE, 2, "short")).toEqual({
      success: false,
      error: "short",
    });
  });
});
