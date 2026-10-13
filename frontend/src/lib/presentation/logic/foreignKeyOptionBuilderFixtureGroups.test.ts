import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { build_foreign_key_select_options } from "./foreignKeyOptionBuilder";
import {
  create_base_entity,
  create_competition_entity,
  create_field_metadata,
  create_fixture_entity,
} from "./foreignKeyOptionBuilder.test_support";

describe("foreignKeyOptionBuilder", () => {
  describe("build_foreign_key_select_options", () => {
    it("sets group to competition name for fixture entities", () => {
      const field = create_field_metadata({
        field_name: "fixture_id",
        foreign_key_entity: "Fixture",
      });
      const options_map = {
        fixture_id: [
          create_fixture_entity({ id: "fix_1", competition_id: "comp_1" }),
        ],
        competition_id: [create_competition_entity("comp_1", "Premier League")],
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
        competition_id: [create_competition_entity("comp_1", "Premier League")],
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
        competition_id: [create_competition_entity("comp_1", "Premier League")],
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
          {
            ...create_base_entity({ id: "t1" }),
            name: "Arsenal",
          } as unknown as BaseEntity,
        ],
        competition_id: [create_competition_entity("comp_1", "Premier League")],
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
        competition_id: [create_competition_entity("comp_1", "League A")],
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
