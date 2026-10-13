import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_foreign_key_select_options,
  is_jersey_color_field,
} from "./foreignKeyOptionBuilder";
import {
  create_base_entity,
  create_field_metadata,
} from "./foreignKeyOptionBuilder.test_support";

describe("foreignKeyOptionBuilder", () => {
  describe("is_jersey_color_field", () => {
    it("returns true for JerseyColor entity", () => {
      const field = create_field_metadata({
        foreign_key_entity: "JerseyColor",
      });
      expect(is_jersey_color_field(field)).toBe(true);
    });

    it("returns true case-insensitively", () => {
      const field = create_field_metadata({
        foreign_key_entity: "jerseycolor",
      });
      expect(is_jersey_color_field(field)).toBe(true);
    });

    it("returns false for non-jersey entity", () => {
      const field = create_field_metadata({ foreign_key_entity: "Team" });
      expect(is_jersey_color_field(field)).toBe(false);
    });

    it("returns false when foreign_key_entity is undefined", () => {
      const field = create_field_metadata();
      expect(is_jersey_color_field(field)).toBe(false);
    });
  });

  describe("build_foreign_key_select_options", () => {
    it("returns options from entities in options_map", () => {
      const field = create_field_metadata({
        field_name: "team_id",
        foreign_key_entity: "Team",
      });
      const options_map = {
        team_id: [
          {
            ...create_base_entity({ id: "t1" }),
            name: "Arsenal",
          } as unknown as BaseEntity,
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("t1");
      expect(result[0].label).toBe("Arsenal");
      expect(result[0].group).toBeUndefined();
    });

    it("filters out entities with empty ids", () => {
      const field = create_field_metadata({ field_name: "team_id" });
      const options_map = {
        team_id: [
          {
            ...create_base_entity({ id: "" }),
            name: "Empty",
          } as unknown as BaseEntity,
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(0);
    });

    it("returns empty array when field not in options_map", () => {
      const field = create_field_metadata({ field_name: "team_id" });
      const result = build_foreign_key_select_options(field, {});
      expect(result).toHaveLength(0);
    });

    it("includes color_swatch for jersey color entities", () => {
      const field = create_field_metadata({
        field_name: "jersey_id",
        foreign_key_entity: "JerseyColor",
      });
      const options_map = {
        jersey_id: [
          {
            ...create_base_entity({ id: "j1" }),
            nickname: "Home Kit",
            main_color: "#FF0000",
          } as unknown as BaseEntity,
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].color_swatch).toBe("#FF0000");
    });
  });
});
