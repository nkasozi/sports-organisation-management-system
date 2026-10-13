import { describe, expect, it } from "vitest";

import {
  DYNAMIC_FORM_ENTITY_TYPE,
  is_dynamic_form_entity_type,
  normalize_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { read_dynamic_form_text_value } from "./dynamicFormDataAccess";

describe("dynamicFormConstants", () => {
  it("normalizes entity types by lower-casing and removing separators", () => {
    expect(normalize_dynamic_form_entity_type("Fixture Details-Setup")).toBe(
      DYNAMIC_FORM_ENTITY_TYPE.FIXTURE_DETAILS_SETUP,
    );
    expect(
      is_dynamic_form_entity_type(
        "system_user",
        DYNAMIC_FORM_ENTITY_TYPE.SYSTEM_USER,
      ),
    ).toBe(true);
    expect(
      is_dynamic_form_entity_type("team", DYNAMIC_FORM_ENTITY_TYPE.FIXTURE),
    ).toBe(false);
  });

  it("reads text form values and treats non-text values as empty", () => {
    const form_data = { name: "Lions", count: 3, missing: void 0 };
    expect(read_dynamic_form_text_value(form_data, "name")).toBe("Lions");
    expect(read_dynamic_form_text_value(form_data, "count")).toBe("");
    expect(read_dynamic_form_text_value(form_data, "missing")).toBe("");
    expect(read_dynamic_form_text_value(form_data, "absent")).toBe("");
  });
});
