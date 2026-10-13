import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  build_entity_display_label,
  format_entity_display_name,
  get_display_value_for_foreign_key,
} from "./dynamicFormLogic";
import { create_base_entity } from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("build_entity_display_label", () => {
    it("returns name when present", () => {
      const entity = {
        ...create_base_entity(),
        name: "Test Organization",
      } as never;
      expect(build_entity_display_label(entity)).toBe("Test Organization");
    });

    it("returns full name when first_name and last_name present", () => {
      const entity = {
        ...create_base_entity(),
        first_name: "John",
        last_name: "Doe",
      } as never;
      expect(build_entity_display_label(entity)).toBe("John Doe");
    });

    it("returns title when name not present", () => {
      const entity = { ...create_base_entity(), title: "Test Title" } as never;
      expect(build_entity_display_label(entity)).toBe("Test Title");
    });

    it("returns id when no display fields present", () => {
      const entity = create_base_entity({ id: "entity_123" });
      expect(build_entity_display_label(entity)).toBe("entity_123");
    });

    it("trims whitespace from name", () => {
      const entity = { ...create_base_entity(), name: "  Test  " } as never;
      expect(build_entity_display_label(entity)).toBe("  Test  ");
    });

    it("returns team names for fixtures when available", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        home_team_name: "Manchester United",
        away_team_name: "Liverpool",
      } as never;
      expect(build_entity_display_label(entity)).toBe(
        "Manchester United vs Liverpool",
      );
    });

    it("returns scheduled date for fixtures without team names", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "2024-03-15",
      } as never;
      expect(build_entity_display_label(entity)).toBe("Fixture [15 Mar 2024]");
    });

    it("returns round name for fixtures without team names or date", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "",
        round_name: "Quarter Finals",
      } as never;
      expect(build_entity_display_label(entity)).toBe(
        "Fixture (Quarter Finals)",
      );
    });

    it("returns shortened id for fixtures without any display data", () => {
      const entity = {
        ...create_base_entity({ id: "fixture_12345678_extra" }),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "",
        round_name: "",
      } as never;
      expect(build_entity_display_label(entity)).toBe("Fixture: fixture_");
    });
  });

  describe("get_display_value_for_foreign_key", () => {
    it("returns display label for found option", () => {
      const options = [
        { ...create_base_entity(), id: "opt_1", name: "Option 1" } as never,
        { ...create_base_entity(), id: "opt_2", name: "Option 2" } as never,
      ];

      const result = get_display_value_for_foreign_key(options, "opt_1");
      expect(result).toBe("Option 1");
    });

    it("returns value when option not found", () => {
      const options = [
        { ...create_base_entity(), id: "opt_1", name: "Option 1" } as never,
      ];

      const result = get_display_value_for_foreign_key(options, "not_found");
      expect(result).toBe("not_found");
    });

    it("handles empty value", () => {
      const options = [] as BaseEntity[];
      const result = get_display_value_for_foreign_key(options, "");
      expect(result).toBe("");
    });

    it("handles missing value", () => {
      const options = [] as BaseEntity[];
      const result = get_display_value_for_foreign_key(options);
      expect(result).toBe("");
    });
  });

  describe("format_entity_display_name", () => {
    it("converts CamelCase to spaced title case", () => {
      expect(format_entity_display_name("CompetitionFormat")).toBe(
        "Competition Format",
      );
    });

    it("converts snake_case to title case", () => {
      expect(format_entity_display_name("player_profile")).toBe(
        "Player Profile",
      );
    });

    it("returns Entity for empty string", () => {
      expect(format_entity_display_name("")).toBe("Entity");
    });

    it("returns single word capitalised", () => {
      expect(format_entity_display_name("team")).toBe("Team");
    });
  });
});
