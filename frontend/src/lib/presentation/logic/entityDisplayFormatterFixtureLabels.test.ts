import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { build_entity_display_label } from "./entityDisplayFormatter";
import { create_base_entity } from "./entityDisplayFormatter.test_support";

describe("entityDisplayFormatter", () => {
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
});
