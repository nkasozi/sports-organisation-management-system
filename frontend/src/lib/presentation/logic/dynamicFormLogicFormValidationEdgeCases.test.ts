import { describe, expect, it } from "vitest";

import { validate_form_data_against_metadata } from "./dynamicFormLogic";
import {
  create_entity_metadata,
  create_field_metadata,
} from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("validate_form_data_against_metadata", () => {
    it("treats an empty stage template array as missing when required", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "stage_templates",
            display_name: "Stage Template",
            field_type: "stage_template_array",
            is_required: true,
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { stage_templates: [] },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error["stage_templates"]).toBe(
          "Stage Template is required",
        );
      }
    });

    it("skips hide_on_create fields during create even when required", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "rater_role",
            display_name: "Rater Role",
            is_required: true,
            hide_on_create: true,
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { rater_role: "" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(true);
    });

    it("skips hide_on_edit fields during edit even when required", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "secret_code",
            display_name: "Secret Code",
            is_required: true,
            hide_on_edit: true,
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { secret_code: "" },
        metadata,
        true,
        "",
      );

      expect(result.success).toBe(true);
    });

    it("treats a star_rating of 0 as empty when required", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "overall",
            display_name: "Overall",
            field_type: "star_rating",
            is_required: true,
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { overall: 0 },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error["overall"]).toBe("Overall is required");
      }
    });
  });
});
