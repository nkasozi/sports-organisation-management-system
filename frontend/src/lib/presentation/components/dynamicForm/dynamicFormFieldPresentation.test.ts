import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { DYNAMIC_FORM_FIELD_TYPE } from "$lib/presentation/logic/dynamicFormConstants";

import {
  is_fallback_image_source,
  is_full_width_dynamic_form_field,
  shows_shared_validation_error,
  to_form_number_value,
  to_form_string_value,
} from "./dynamicFormFieldPresentation";

function field(
  field_type: FieldMetadata["field_type"],
  field_name: string,
): FieldMetadata {
  return {
    field_name,
    display_name: field_name,
    field_type,
    is_required: false,
    is_read_only: false,
  };
}

describe("is_full_width_dynamic_form_field", () => {
  it.each([
    [DYNAMIC_FORM_FIELD_TYPE.FILE, "logo", true],
    [DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY, "stages", true],
    [DYNAMIC_FORM_FIELD_TYPE.STRING, "team_description", true],
    [DYNAMIC_FORM_FIELD_TYPE.STRING, "street_address", true],
    [DYNAMIC_FORM_FIELD_TYPE.STRING, "notes", true],
    [DYNAMIC_FORM_FIELD_TYPE.STRING, "name", false],
    [DYNAMIC_FORM_FIELD_TYPE.NUMBER, "notes", false],
  ])("%s field %s full width is %s", (field_type, field_name, expected) => {
    expect(
      is_full_width_dynamic_form_field(field(field_type, field_name)),
    ).toBe(expected);
  });
});

describe("shows_shared_validation_error", () => {
  it("hides the shared error for enum and foreign key fields", () => {
    expect(shows_shared_validation_error(DYNAMIC_FORM_FIELD_TYPE.ENUM)).toBe(
      false,
    );
    expect(
      shows_shared_validation_error(DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY),
    ).toBe(false);
    expect(shows_shared_validation_error(DYNAMIC_FORM_FIELD_TYPE.STRING)).toBe(
      true,
    );
  });
});

describe("value coercion", () => {
  it("keeps strings and blanks everything else", () => {
    expect(to_form_string_value("abc")).toBe("abc");
    expect(to_form_string_value(5)).toBe("");
    expect(to_form_string_value(undefined)).toBe("");
  });

  it("keeps numbers and zeroes everything else", () => {
    expect(to_form_number_value(7)).toBe(7);
    expect(to_form_number_value("7")).toBe(0);
  });
});

describe("is_fallback_image_source", () => {
  it("recognises absolute urls that already point at the fallback image", () => {
    expect(is_fallback_image_source("http://localhost/no-image.svg")).toBe(
      true,
    );
    expect(is_fallback_image_source("http://localhost/logo.png")).toBe(false);
  });
});
