import { describe, expect, it } from "vitest";

import {
  format_enum_label,
  has_enum_options,
  is_jersey_color_field,
  should_field_be_read_only,
} from "./dynamicFormLogic";
import { create_field_metadata } from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("should_field_be_read_only", () => {
    const empty_auth: Set<string> = new Set();

    it("returns true when field is_read_only", () => {
      const field = create_field_metadata({ is_read_only: true });
      expect(should_field_be_read_only(field, false, empty_auth)).toBe(true);
    });

    it("returns true when is_read_only_on_edit in edit mode", () => {
      const field = create_field_metadata({
        is_read_only_on_edit: true,
      } as never);
      expect(should_field_be_read_only(field, true, empty_auth)).toBe(true);
    });

    it("returns false when is_read_only_on_edit but not in edit mode", () => {
      const field = create_field_metadata({
        is_read_only_on_edit: true,
      } as never);
      expect(should_field_be_read_only(field, false, empty_auth)).toBe(false);
    });

    it("returns true when field is in auth restricted set", () => {
      const field = create_field_metadata({ field_name: "organization_id" });
      const restricted = new Set(["organization_id"]);
      expect(should_field_be_read_only(field, false, restricted)).toBe(true);
    });
  });

  describe("format_enum_label", () => {
    it("converts snake_case to Title Case", () => {
      expect(format_enum_label("pending_approval")).toBe("Pending Approval");
    });

    it("capitalises single word", () => {
      expect(format_enum_label("approved")).toBe("Approved");
    });

    it("handles multiple words", () => {
      expect(format_enum_label("not_yet_started")).toBe("Not Yet Started");
    });
  });

  describe("has_enum_options", () => {
    it("returns true when enum_options is populated", () => {
      const field = create_field_metadata({
        enum_options: [{ value: "a", label: "A" }],
      } as never);
      expect(has_enum_options(field)).toBe(true);
    });

    it("returns true when enum_values is populated", () => {
      const field = create_field_metadata({ enum_values: ["a", "b"] });
      expect(has_enum_options(field)).toBe(true);
    });

    it("returns true when enum_dependency is set", () => {
      const field = create_field_metadata({
        enum_dependency: { depends_on_field: "role", options_map: {} },
      } as never);
      expect(has_enum_options(field)).toBe(true);
    });

    it("returns false when no enum config", () => {
      const field = create_field_metadata();
      expect(has_enum_options(field)).toBe(false);
    });
  });

  describe("is_jersey_color_field", () => {
    it("returns true when foreign_key_entity is jerseycolor", () => {
      const field = create_field_metadata({
        foreign_key_entity: "JerseyColor",
      });
      expect(is_jersey_color_field(field)).toBe(true);
    });

    it("returns false for non-jersey field", () => {
      const field = create_field_metadata({ foreign_key_entity: "Team" });
      expect(is_jersey_color_field(field)).toBe(false);
    });

    it("returns false when foreign_key_entity is undefined", () => {
      const field = create_field_metadata();
      expect(is_jersey_color_field(field)).toBe(false);
    });
  });
});
