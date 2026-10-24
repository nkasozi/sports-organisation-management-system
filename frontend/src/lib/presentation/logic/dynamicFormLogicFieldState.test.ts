import { describe, expect, it } from "vitest";

import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  initialize_form_data_from_metadata,
  is_field_controlled_by_sub_entity_filter,
  is_field_visible_by_visible_when_condition,
} from "./dynamicFormLogic";
import {
  create_entity_metadata,
  create_field_metadata,
} from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("initialize_form_data_from_metadata", () => {
    it("initializes with default values for create mode", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "count", field_type: "number" }),
          create_field_metadata({
            field_name: "active",
            field_type: "boolean",
          }),
        ],
      });

      const result = initialize_form_data_from_metadata(metadata);

      expect(result.name).toBe("");
      expect(result.count).toBe("");
      expect(result.active).toBe(false);
    });

    it("uses existing data for edit mode", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "count", field_type: "number" }),
        ],
      });
      const existing_data = { id: "123", name: "Existing", count: 42 } as never;

      const result = initialize_form_data_from_metadata(
        metadata,
        existing_data,
      );

      expect(result.name).toBe("Existing");
      expect(result.count).toBe(42);
    });

    it("uses default for missing fields in existing data", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({
            field_name: "new_field",
            field_type: "string",
          }),
        ],
      });
      const existing_data = { id: "123", name: "Existing" } as never;

      const result = initialize_form_data_from_metadata(
        metadata,
        existing_data,
      );

      expect(result.name).toBe("Existing");
      expect(result.new_field).toBe("");
    });
  });

  describe("is_field_visible_by_visible_when_condition", () => {
    it("returns true when field has no visible_when condition", () => {
      const field = create_field_metadata();
      expect(is_field_visible_by_visible_when_condition(field, {})).toBe(true);
    });

    it("returns true when dependency value matches", () => {
      const field = create_field_metadata({
        visible_when: {
          depends_on_field: "status",
          visible_when_values: ["approved"],
        },
      } as never);
      expect(
        is_field_visible_by_visible_when_condition(field, {
          status: "approved",
        }),
      ).toBe(true);
    });

    it("returns false when dependency value does not match", () => {
      const field = create_field_metadata({
        visible_when: {
          depends_on_field: "status",
          visible_when_values: ["approved"],
        },
      } as never);
      expect(
        is_field_visible_by_visible_when_condition(field, {
          status: "pending",
        }),
      ).toBe(false);
    });

    it("returns false when dependency value is missing", () => {
      const field = create_field_metadata({
        visible_when: {
          depends_on_field: "status",
          visible_when_values: ["approved"],
        },
      } as never);
      expect(is_field_visible_by_visible_when_condition(field, {})).toBe(false);
    });
  });

  describe("is_field_controlled_by_sub_entity_filter", () => {
    it("returns false when filter is missing", () => {
      expect(is_field_controlled_by_sub_entity_filter("player_id")).toBe(false);
    });

    it("returns true when field matches foreign_key_field", () => {
      const filter = {
        foreign_key_field: "player_id",
        foreign_key_value: "p1",
      } as SubEntityFilter;
      expect(
        is_field_controlled_by_sub_entity_filter("player_id", filter),
      ).toBe(true);
    });

    it("returns true when field matches holder_type_field", () => {
      const filter = {
        foreign_key_field: "player_id",
        foreign_key_value: "p1",
        holder_type_field: "entity_type",
        holder_type_value: "player",
      } as SubEntityFilter;
      expect(
        is_field_controlled_by_sub_entity_filter("entity_type", filter),
      ).toBe(true);
    });

    it("returns false for an unrelated field", () => {
      const filter = {
        foreign_key_field: "player_id",
        foreign_key_value: "p1",
      } as SubEntityFilter;
      expect(is_field_controlled_by_sub_entity_filter("name", filter)).toBe(
        false,
      );
    });
  });
});
