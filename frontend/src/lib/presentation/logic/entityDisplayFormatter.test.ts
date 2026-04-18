import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  build_entity_display_label,
  build_foreign_entity_cta_label,
  build_foreign_entity_route,
  format_entity_display_name,
  format_enum_label,
  get_display_value_for_foreign_key,
} from "./entityDisplayFormatter";

function create_base_entity(
  overrides: Partial<ScalarInput<BaseEntity>> = {},
): BaseEntity {
  return {
    id: "entity_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as BaseEntity;
}

describe("entityDisplayFormatter", () => {
  describe("build_entity_display_label", () => {
    it("returns name when present", () => {
      const entity = {
        ...create_base_entity(),
        name: "Arsenal",
      } as unknown as BaseEntity;
      expect(build_entity_display_label(entity)).toBe("Arsenal");
    });

    it("returns nickname - main_color for jersey entities", () => {
      const entity = {
        ...create_base_entity(),
        nickname: "Home Kit",
        main_color: "#FF0000",
      } as unknown as BaseEntity;
      expect(build_entity_display_label(entity)).toBe("Home Kit - #FF0000");
    });

    it("returns full name when first_name and last_name present", () => {
      const entity = {
        ...create_base_entity(),
        first_name: "John",
        last_name: "Doe",
      } as unknown as BaseEntity;
      expect(build_entity_display_label(entity)).toBe("John Doe");
    });

    it("returns title when name not present", () => {
      const entity = {
        ...create_base_entity(),
        title: "Match Report",
      } as unknown as BaseEntity;
      expect(build_entity_display_label(entity)).toBe("Match Report");
    });

    it("returns entity id when no display fields present", () => {
      const entity = create_base_entity({ id: "entity_123" });
      expect(build_entity_display_label(entity)).toBe("entity_123");
    });
  });

  describe("build_entity_display_label for fixtures", () => {
    it("shows team names with competition and date", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Lions FC",
        away_team_name: "Tigers FC",
        competition_name: "Premier League",
        scheduled_date: "2025-04-03",
        scheduled_time: "14:00",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe(
        "Premier League - Lions FC vs Tigers FC - 3 Apr 2025 - 14:00",
      );
    });

    it("shows team names without competition when not set", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Lions FC",
        away_team_name: "Tigers FC",
        scheduled_date: "2025-04-03",
        scheduled_time: "14:00",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe("Lions FC vs Tigers FC - 3 Apr 2025 - 14:00");
    });

    it("shows team names with competition but no date", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Lions FC",
        away_team_name: "Tigers FC",
        competition_name: "FA Cup",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe("FA Cup - Lions FC vs Tigers FC");
    });

    it("shows team names only when no competition or date", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Lions FC",
        away_team_name: "Tigers FC",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe("Lions FC vs Tigers FC");
    });

    it("shows date fallback when no team names", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        scheduled_date: "2025-03-15",
      } as unknown as BaseEntity;

      expect(build_entity_display_label(entity)).toBe("Fixture [15 Mar 2025]");
    });

    it("shows round name fallback when no date or team names", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        scheduled_date: "",
        round_name: "Quarter Finals",
      } as unknown as BaseEntity;

      expect(build_entity_display_label(entity)).toBe(
        "Fixture (Quarter Finals)",
      );
    });

    it("shows shortened id when no display data available", () => {
      const entity = {
        ...create_base_entity({ id: "fixture_12345678_extra" }),
        home_team_id: "t1",
        away_team_id: "t2",
        scheduled_date: "",
        round_name: "",
      } as unknown as BaseEntity;

      expect(build_entity_display_label(entity)).toBe("Fixture: fixture_");
    });

    it("ignores empty competition_name string", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Team A",
        away_team_name: "Team B",
        competition_name: "   ",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe("Team A vs Team B");
    });

    it("shows date without time when time is empty", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "t1",
        away_team_id: "t2",
        home_team_name: "Team A",
        away_team_name: "Team B",
        competition_name: "League",
        scheduled_date: "2025-06-15",
        scheduled_time: "",
      } as unknown as BaseEntity;

      const label = build_entity_display_label(entity);

      expect(label).toBe("League - Team A vs Team B - 15 Jun 2025");
    });
  });

  describe("get_display_value_for_foreign_key", () => {
    it("returns display label for matching entity", () => {
      const options = [
        {
          ...create_base_entity({ id: "t1" }),
          name: "Arsenal",
        } as unknown as BaseEntity,
      ];
      expect(get_display_value_for_foreign_key(options, "t1")).toBe("Arsenal");
    });

    it("returns raw value when no match found", () => {
      expect(get_display_value_for_foreign_key([], "missing_id")).toBe(
        "missing_id",
      );
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
  });

  describe("format_enum_label", () => {
    it("converts snake_case to Title Case", () => {
      expect(format_enum_label("in_progress")).toBe("In Progress");
    });

    it("handles single word", () => {
      expect(format_enum_label("active")).toBe("Active");
    });
  });

  describe("build_foreign_entity_route", () => {
    it("returns correct route for known entity types", () => {
      expect(build_foreign_entity_route("player")).toBe("/players");
      expect(build_foreign_entity_route("team")).toBe("/teams");
      expect(build_foreign_entity_route("fixture")).toBe("/fixtures");
    });

    it("returns empty string for unknown entity type", () => {
      expect(build_foreign_entity_route("unknown")).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(build_foreign_entity_route(void 0)).toBe("");
    });
  });

  describe("build_foreign_entity_cta_label", () => {
    it("returns correct CTA for known entity types", () => {
      expect(build_foreign_entity_cta_label("player")).toBe("Create Players");
      expect(build_foreign_entity_cta_label("team")).toBe("Create Teams");
    });

    it("returns generic Create for unknown entity type", () => {
      expect(build_foreign_entity_cta_label("unknown")).toBe("Create");
    });
  });
});
