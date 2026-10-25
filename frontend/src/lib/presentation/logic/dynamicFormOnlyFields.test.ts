import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { omit_form_only_fields } from "./dynamicFormOnlyFields";

function field(field_name: string, is_form_only = false): FieldMetadata {
  return {
    field_name,
    display_name: field_name,
    field_type: "foreign_key",
    is_required: true,
    is_read_only: false,
    is_form_only,
  };
}

describe("form-only fields are never saved", () => {
  it("drops the competition picker but keeps the real fields", () => {
    expect(
      omit_form_only_fields(
        { organization_id: "o1", competition_id: "c1", fixture_id: "f1" },
        [
          field("organization_id"),
          field("competition_id", true),
          field("fixture_id"),
        ],
      ),
    ).toEqual({ organization_id: "o1", fixture_id: "f1" });
  });
});
