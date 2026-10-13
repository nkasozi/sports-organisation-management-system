import { describe, expect, it } from "vitest";

import { is_success } from "../types/Result";
import { check_fixture_can_start } from "./fixtureStartChecks";
import {
  create_test_fixture,
  create_test_lineup,
  create_test_official_assignment,
} from "./fixtureStartChecksEntities.test_support";
import {
  create_mock_lineup_use_cases,
  create_mock_official_use_cases,
} from "./fixtureStartChecksUseCaseMocks.test_support";

describe("fixtureStartChecks", () => {
  describe("check_fixture_can_start", () => {
    it("should pass when fixture has officials and lineups", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
      });

      const officials = [
        create_test_official_assignment("fixture-1", "official-1", "role-1"),
      ];

      const lineups = [
        create_test_lineup("fixture-1", "team-home", "submitted"),
        create_test_lineup("fixture-1", "team-away", "submitted"),
      ];

      const official_use_cases = create_mock_official_use_cases(officials);
      const lineup_use_cases = create_mock_lineup_use_cases(lineups);

      const result = await check_fixture_can_start(
        fixture,
        official_use_cases,
        lineup_use_cases,
      );

      expect(result.success).toBe(true);
      if (!is_success(result)) return;
      expect(result.data.can_start).toBe(true);
      expect(result.data.officials_check.status).toBe("passed");
      expect(result.data.officials_check.fix_suggestion).toBe("");
      expect(result.data.home_lineup_check.status).toBe("passed");
      expect(result.data.home_lineup_check.fix_suggestion).toBe("");
      expect(result.data.away_lineup_check.status).toBe("passed");
      expect(result.data.away_lineup_check.fix_suggestion).toBe("");
    });

    it("should fail when no officials assigned", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
      });

      const official_use_cases = create_mock_official_use_cases([]);
      const lineup_use_cases = create_mock_lineup_use_cases([]);

      const result = await check_fixture_can_start(
        fixture,
        official_use_cases,
        lineup_use_cases,
      );

      expect(result.success).toBe(true);
      if (!is_success(result)) return;
      expect(result.data.can_start).toBe(false);
      expect(result.data.officials_check.status).toBe("failed");
      expect(result.data.officials_check.message).toContain(
        "No officials assigned",
      );
      expect(result.data.officials_check.fix_suggestion).toContain(
        "Fixture Details Setup",
      );
    });

    it("should fail when home team lineup missing", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
      });

      const officials = [
        create_test_official_assignment("fixture-1", "official-1", "role-1"),
      ];

      const lineups = [
        create_test_lineup("fixture-1", "team-away", "submitted"),
      ];

      const official_use_cases = create_mock_official_use_cases(officials);
      const lineup_use_cases = create_mock_lineup_use_cases(lineups);

      const result = await check_fixture_can_start(
        fixture,
        official_use_cases,
        lineup_use_cases,
      );

      expect(result.success).toBe(true);
      if (!is_success(result)) return;
      expect(result.data.can_start).toBe(false);
      expect(result.data.home_lineup_check.status).toBe("failed");
      expect(result.data.home_lineup_check.message).toContain(
        "home team lineup",
      );
    });

    it("should fail when away team lineup missing", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
      });

      const officials = [
        create_test_official_assignment("fixture-1", "official-1", "role-1"),
      ];

      const lineups = [
        create_test_lineup("fixture-1", "team-home", "submitted"),
      ];

      const official_use_cases = create_mock_official_use_cases(officials);
      const lineup_use_cases = create_mock_lineup_use_cases(lineups);

      const result = await check_fixture_can_start(
        fixture,
        official_use_cases,
        lineup_use_cases,
      );

      expect(result.success).toBe(true);
      if (!is_success(result)) return;
      expect(result.data.can_start).toBe(false);
      expect(result.data.away_lineup_check.status).toBe("failed");
      expect(result.data.away_lineup_check.message).toContain(
        "away team lineup",
      );
    });

    it("should fail when lineups are in draft status", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
      });

      const officials = [
        create_test_official_assignment("fixture-1", "official-1", "role-1"),
      ];

      const lineups = [
        create_test_lineup("fixture-1", "team-home", "draft"),
        create_test_lineup("fixture-1", "team-away", "submitted"),
      ];

      const official_use_cases = create_mock_official_use_cases(officials);
      const lineup_use_cases = create_mock_lineup_use_cases(lineups);

      const result = await check_fixture_can_start(
        fixture,
        official_use_cases,
        lineup_use_cases,
      );

      expect(result.success).toBe(true);
      if (!is_success(result)) return;
      expect(result.data.can_start).toBe(false);
      expect(result.data.home_lineup_check.status).toBe("failed");
      expect(result.data.home_lineup_check.message).toContain("not submitted");
    });
  });
});
