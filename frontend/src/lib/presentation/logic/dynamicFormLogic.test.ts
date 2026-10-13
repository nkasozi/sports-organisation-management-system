import { describe, expect, it } from "vitest";

import {
  build_form_title,
  build_sub_entity_filter,
  determine_if_edit_mode,
  get_sub_entity_fields,
} from "./dynamicFormLogic";
import {
  create_entity_metadata,
  create_field_metadata,
} from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("determine_if_edit_mode", () => {
    it("returns true when entity has id", () => {
      const result = determine_if_edit_mode({ id: "123" });
      expect(result).toBe(true);
    });

    it("returns false when entity is missing", () => {
      const result = determine_if_edit_mode();
      expect(result).toBe(false);
    });

    it("returns false when entity has no id", () => {
      const result = determine_if_edit_mode({});
      expect(result).toBe(false);
    });

    it("returns false when entity has no id field", () => {
      const result = determine_if_edit_mode({} as never);
      expect(result).toBe(false);
    });
  });

  describe("build_form_title", () => {
    it("returns Edit prefix when in edit mode", () => {
      const result = build_form_title("Player", true);
      expect(result).toBe("Edit Player");
    });

    it("returns Create prefix when not in edit mode", () => {
      const result = build_form_title("Player", false);
      expect(result).toBe("Create Player");
    });

    it("handles empty display name", () => {
      const result = build_form_title("", false);
      expect(result).toBe("Create ");
    });
  });

  describe("get_sub_entity_fields", () => {
    it("returns empty array when metadata is missing", () => {
      const result = get_sub_entity_fields();
      expect(result).toEqual([]);
    });

    it("returns only sub_entity fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({
            field_name: "qualifications",
            field_type: "sub_entity",
          }),
          create_field_metadata({ field_name: "status", field_type: "enum" }),
          create_field_metadata({
            field_name: "identifications",
            field_type: "sub_entity",
          }),
        ],
      });

      const result = get_sub_entity_fields(metadata);

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.field_name)).toEqual([
        "qualifications",
        "identifications",
      ]);
    });

    it("returns empty array when no sub_entity fields exist", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "status", field_type: "enum" }),
        ],
      });

      const result = get_sub_entity_fields(metadata);

      expect(result).toEqual([]);
    });
  });

  describe("build_sub_entity_filter", () => {
    it("returns undefined when field has no sub_entity_config", () => {
      const field = create_field_metadata({ field_type: "sub_entity" });
      const result = build_sub_entity_filter(field, { id: "123" });
      expect(result).toBeUndefined();
    });

    it("returns undefined when parent entity has no id", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
        },
      });
      const result = build_sub_entity_filter(field, {});
      expect(result).toBeUndefined();
    });

    it("returns undefined when parent entity is missing", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
        },
      });
      const result = build_sub_entity_filter(field);
      expect(result).toBeUndefined();
    });

    it("builds filter with required fields", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
          holder_type_field: "holder_type",
          holder_type_value: "player",
        },
      });

      const result = build_sub_entity_filter(field, { id: "player_123" });

      expect(result).not.toBeNull();
      expect(result?.foreign_key_field).toBe("holder_id");
      expect(result?.foreign_key_value).toBe("player_123");
      expect(result?.holder_type_field).toBe("holder_type");
      expect(result?.holder_type_value).toBe("player");
    });
  });
});
