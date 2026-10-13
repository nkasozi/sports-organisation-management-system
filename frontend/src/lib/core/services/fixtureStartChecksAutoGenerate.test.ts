import { describe, expect, it } from "vitest";

import {
  expect_lineup_failure,
  expect_lineup_success,
} from "./fixtureLineupGeneration.test_support";
import { auto_generate_lineups_if_possible } from "./fixtureStartChecks";
import {
  create_test_fixture,
  create_test_player_membership,
} from "./fixtureStartChecksEntities.test_support";
import {
  create_mock_competition_use_cases,
  create_mock_fixture_use_cases,
  create_mock_lineup_use_cases,
  create_mock_membership_use_cases,
  create_mock_organization_use_cases,
  create_mock_player_position_use_cases,
  create_mock_player_use_cases,
  create_mock_sport_use_cases,
} from "./fixtureStartChecksUseCaseMocks.test_support";

describe("fixtureStartChecks", () => {
  describe("auto_generate_lineups_if_possible", () => {
    it("should auto-generate when player count matches exactly", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        competition_id: "comp-1",
      });
      const team_players = [
        create_test_player_membership("player-1", "team-1"),
        create_test_player_membership("player-2", "team-1"),
        create_test_player_membership("player-3", "team-1"),
      ];

      const membership_use_cases =
        create_mock_membership_use_cases(team_players);
      const player_use_cases = create_mock_player_use_cases(team_players);
      const player_position_use_cases = create_mock_player_position_use_cases();
      const lineup_use_cases = create_mock_lineup_use_cases([]);
      const fixture_use_cases = create_mock_fixture_use_cases([]);
      const sport_use_cases = create_mock_sport_use_cases(3, 3);
      const competition_use_cases = create_mock_competition_use_cases();
      const organization_use_cases = create_mock_organization_use_cases();

      const result = await auto_generate_lineups_if_possible(
        fixture,
        "team-1",
        "Test Team",
        membership_use_cases,
        player_use_cases,
        player_position_use_cases,
        lineup_use_cases,
        fixture_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      const success = expect_lineup_success(result);
      expect(success.lineup.selected_players).toHaveLength(3);
      expect(success.lineup.status).toBe("submitted");
    });

    it("should auto-generate when player count is within range", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        competition_id: "comp-1",
      });
      const team_players = [
        create_test_player_membership("player-1", "team-1"),
        create_test_player_membership("player-2", "team-1"),
        create_test_player_membership("player-3", "team-1"),
        create_test_player_membership("player-4", "team-1"),
      ];

      const membership_use_cases =
        create_mock_membership_use_cases(team_players);
      const player_use_cases = create_mock_player_use_cases(team_players);
      const player_position_use_cases = create_mock_player_position_use_cases();
      const lineup_use_cases = create_mock_lineup_use_cases([]);
      const fixture_use_cases = create_mock_fixture_use_cases([]);
      const sport_use_cases = create_mock_sport_use_cases(2, 5);
      const competition_use_cases = create_mock_competition_use_cases();
      const organization_use_cases = create_mock_organization_use_cases();

      const result = await auto_generate_lineups_if_possible(
        fixture,
        "team-1",
        "Test Team",
        membership_use_cases,
        player_use_cases,
        player_position_use_cases,
        lineup_use_cases,
        fixture_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      const success = expect_lineup_success(result);
      expect(success.lineup.selected_players).toHaveLength(4);
    });

    it("should fail when player count below minimum", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        competition_id: "comp-1",
      });
      const team_players = [
        create_test_player_membership("player-1", "team-1"),
        create_test_player_membership("player-2", "team-1"),
      ];

      const membership_use_cases =
        create_mock_membership_use_cases(team_players);
      const player_use_cases = create_mock_player_use_cases(team_players);
      const player_position_use_cases = create_mock_player_position_use_cases();
      const lineup_use_cases = create_mock_lineup_use_cases([]);
      const fixture_use_cases = create_mock_fixture_use_cases([]);
      const sport_use_cases = create_mock_sport_use_cases(3, 5);
      const competition_use_cases = create_mock_competition_use_cases();
      const organization_use_cases = create_mock_organization_use_cases();

      const result = await auto_generate_lineups_if_possible(
        fixture,
        "team-1",
        "Test Team",
        membership_use_cases,
        player_use_cases,
        player_position_use_cases,
        lineup_use_cases,
        fixture_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      const failure = expect_lineup_failure(result);
      expect(failure.error_message).toContain("Test Team");
      expect(failure.error_message).toContain("only 2 active player(s)");
      expect(failure.error_message).toContain("minimum is 3");
      expect(failure.fix_suggestion).toContain("Player Team Memberships");
      expect(failure.fix_suggestion).toContain("Test Team");
    });
  });
});
