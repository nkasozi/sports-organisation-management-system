import { describe, expect, it } from "vitest";

import { parse_description_text } from "./ContentScalars";
import { parse_entity_id } from "./IdentityScalars";
import { normalize_scalar_input } from "./ScalarInfrastructure";

const MISSING_FORM_VALUE = undefined as unknown as string;
const NUMBER_FORM_VALUE = 42 as unknown as string;

describe("scalar parsing of untyped runtime input", () => {
  it("treats a value that is missing at runtime as empty instead of crashing", () => {
    expect(normalize_scalar_input(MISSING_FORM_VALUE)).toBe("");
  });

  it("accepts a missing optional field", () => {
    expect(parse_description_text(MISSING_FORM_VALUE)).toEqual({
      success: true,
      data: "",
    });
  });

  it("rejects a missing required field with its validation message", () => {
    expect(
      parse_entity_id(MISSING_FORM_VALUE, "Organization is required"),
    ).toEqual({
      success: false,
      error: "Organization is required",
    });
  });

  it("does not coerce non-string values into strings", () => {
    expect(normalize_scalar_input(NUMBER_FORM_VALUE)).toBe("");
  });
});
