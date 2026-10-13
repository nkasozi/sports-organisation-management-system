import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_foreign_entity_cta_label,
  build_foreign_entity_route,
  build_foreign_key_select_options,
  find_dependent_enum_fields,
} from "./dynamicFormLogic";
import {
  create_entity_metadata,
  create_field_metadata,
} from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("build_foreign_key_select_options", () => {
    it("returns options mapped from entities", () => {
      const field = create_field_metadata({
        field_name: "team_id",
        foreign_key_entity: "Team",
      });
      const options_map = {
        team_id: [
          {
            id: "t1",
            name: "Arsenal",
            created_at: "",
            updated_at: "",
          } as unknown as BaseEntity,
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("t1");
      expect(result[0].label).toBe("Arsenal");
    });

    it("filters out entities with empty ids", () => {
      const field = create_field_metadata({ field_name: "team_id" });
      const options_map = {
        team_id: [
          {
            id: "",
            name: "Empty",
            created_at: "",
            updated_at: "",
          } as unknown as BaseEntity,
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(0);
    });

    it("returns empty array when no options for field", () => {
      const field = create_field_metadata({ field_name: "team_id" });
      const result = build_foreign_key_select_options(field, {});
      expect(result).toHaveLength(0);
    });
  });

  describe("build_foreign_entity_route", () => {
    it.each([
      ["player", "/players"],
      ["team", "/teams"],
      ["organization", "/organizations"],
      ["competition", "/competitions"],
      ["fixture", "/fixtures"],
      ["playerposition", "/player-positions"],
      ["venue", "/venues"],
      ["unknown", ""],
    ])("%s -> %s", (entity_type, expected) => {
      expect(build_foreign_entity_route(entity_type)).toBe(expected);
    });

    it("returns an empty route when the entity type is missing", () => {
      expect(build_foreign_entity_route()).toBe("");
    });
  });

  describe("build_foreign_entity_cta_label", () => {
    it("returns labelled string for known entity types", () => {
      expect(build_foreign_entity_cta_label("player")).toBe("Create Players");
      expect(build_foreign_entity_cta_label("team")).toBe("Create Teams");
    });

    it("returns generic Create for unknown type", () => {
      expect(build_foreign_entity_cta_label("unknown")).toBe("Create");
      expect(build_foreign_entity_cta_label()).toBe("Create");
    });
  });

  describe("find_dependent_enum_fields", () => {
    it("returns fields that depend on the given parent field", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "role" }),
          create_field_metadata({
            field_name: "sub_role",
            enum_dependency: {
              depends_on_field: "role",
              options_map: {},
            },
          } as never),
          create_field_metadata({ field_name: "name" }),
        ],
      });

      const result = find_dependent_enum_fields(metadata, "role");

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe("sub_role");
    });

    it("returns empty array when no dependent fields exist", () => {
      const metadata = create_entity_metadata({
        fields: [create_field_metadata({ field_name: "name" })],
      });

      expect(find_dependent_enum_fields(metadata, "role")).toHaveLength(0);
    });
  });
});
