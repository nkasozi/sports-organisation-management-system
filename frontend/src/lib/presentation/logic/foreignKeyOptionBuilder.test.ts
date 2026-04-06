import { describe, it, expect } from "vitest";
import type {
  FieldMetadata,
  BaseEntity,
} from "../../core/entities/BaseEntity";
import {
  build_foreign_key_select_options,
  is_jersey_color_field,
} from "./foreignKeyOptionBuilder";

function create_field_metadata(
  overrides: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name: "test_field",
    display_name: "Test Field",
    field_type: "foreign_key",
    is_required: false,
    is_read_only: false,
    ...overrides,
  };
}

function create_base_entity(overrides: Partial<BaseEntity> = {}): BaseEntity {
  return {
    id: "entity_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_fixture_entity(
  overrides: Record<string, unknown> = {},
): BaseEntity {
  return {
    ...create_base_entity(),
    home_team_id: "team_1",
    away_team_id: "team_2",
    home_team_name: "Lions FC",
    away_team_name: "Tigers FC",
    competition_id: "comp_1",
    scheduled_date: "2025-04-03",
    scheduled_time: "14:00",
    ...overrides,
  } as unknown as BaseEntity;
}

function create_competition_entity(
  id: string,
  name: string,
): BaseEntity {
  return {
    ...create_base_entity({ id }),
    name,
  } as unknown as BaseEntity;
}

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
          { ...create_base_entity({ id: "t1" }), name: "Arsenal" } as unknown as BaseEntity,
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
          { ...create_base_entity({ id: "" }), name: "Empty" } as unknown as BaseEntity,
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

    it("sets group to competition name for fixture entities", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
        competition_id: [
          create_competition_entity("comp_1", "Premier League"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].group).toBe("Premier League");
    });

    it("includes competition name in label for fixture entities", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
        competition_id: [
          create_competition_entity("comp_1", "Premier League"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result[0].label).toContain("Premier League");
      expect(result[0].label).toContain("Lions FC vs Tigers FC");
    });

    it("omits group when competition_id not in options_map", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].group).toBeUndefined();
    });

    it("omits group when fixture has no competition_id", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const fixture = create_fixture_entity({ id: "fix_1" });
      delete (fixture as unknown as Record<string, unknown>)["competition_id"];
      const options_map = {
        fixture_id: [fixture],
        competition_id: [
          create_competition_entity("comp_1", "Premier League"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(1);
      expect(result[0].group).toBeUndefined();
    });

    it("groups multiple fixtures by their competition", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({
            id: "fix_1",
            competition_id: "comp_1",
            home_team_name: "Team A",
            away_team_name: "Team B",
          }),
          create_fixture_entity({
            id: "fix_2",
            competition_id: "comp_2",
            home_team_name: "Team C",
            away_team_name: "Team D",
          }),
          create_fixture_entity({
            id: "fix_3",
            competition_id: "comp_1",
            home_team_name: "Team E",
            away_team_name: "Team F",
          }),
        ],
        competition_id: [
          create_competition_entity("comp_1", "Premier League"),
          create_competition_entity("comp_2", "FA Cup"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result).toHaveLength(3);
      expect(result[0].group).toBe("Premier League");
      expect(result[1].group).toBe("FA Cup");
      expect(result[2].group).toBe("Premier League");
    });

    it("does not set group for non-fixture entities", () => {
      const field = create_field_metadata({
        field_name: "team_id",
        foreign_key_entity: "Team",
      });
      const options_map = {
        team_id: [
          { ...create_base_entity({ id: "t1" }), name: "Arsenal" } as unknown as BaseEntity,
        ],
        competition_id: [
          create_competition_entity("comp_1", "Premier League"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result[0].group).toBeUndefined();
    });

    it("handles fixture entity case-insensitively", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
        competition_id: [
          create_competition_entity("comp_1", "League A"),
        ],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result[0].group).toBe("League A");
    });

    it("omits group when competition entity has no name field", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const competition_without_name = create_base_entity({ id: "comp_1" });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
        competition_id: [competition_without_name],
      };

      const result = build_foreign_key_select_options(field, options_map);

      expect(result[0].group).toBeUndefined();
    });
  });
});
