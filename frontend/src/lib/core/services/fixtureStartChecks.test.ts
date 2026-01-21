import { describe, it, expect } from "vitest";
import {
  check_fixture_can_start,
  auto_generate_lineups_if_possible,
  type FixtureCanStartResult,
  type LineupGenerationResult,
} from "./fixtureStartChecks";

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

      expect(result.can_start).toBe(true);
      expect(result.officials_check.status).toBe("passed");
      expect(result.home_lineup_check.status).toBe("passed");
      expect(result.away_lineup_check.status).toBe("passed");
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

      expect(result.can_start).toBe(false);
      expect(result.officials_check.status).toBe("failed");
      expect(result.officials_check.message).toContain("No officials assigned");
      expect(result.officials_check.fix_suggestion).toContain(
        "Go to Fixture Officials",
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

      expect(result.can_start).toBe(false);
      expect(result.home_lineup_check.status).toBe("failed");
      expect(result.home_lineup_check.message).toContain("home team lineup");
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

      expect(result.can_start).toBe(false);
      expect(result.away_lineup_check.status).toBe("failed");
      expect(result.away_lineup_check.message).toContain("away team lineup");
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

      expect(result.can_start).toBe(false);
      expect(result.home_lineup_check.status).toBe("failed");
      expect(result.home_lineup_check.message).toContain("not submitted");
    });
  });

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
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(true);
      expect(result.lineup?.selected_players).toHaveLength(3);
      expect(result.lineup?.status).toBe("submitted");
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
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(true);
      expect(result.lineup?.selected_players).toHaveLength(4);
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
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Test Team");
      expect(result.error_message).toContain("only 2 active player(s)");
      expect(result.error_message).toContain("minimum is 3");
      expect(result.fix_suggestion).toContain("Player Team Memberships");
      expect(result.fix_suggestion).toContain("Test Team");
    });

    it("should fail when player count above maximum", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        competition_id: "comp-1",
      });
      const team_players = [
        create_test_player_membership("player-1", "team-1"),
        create_test_player_membership("player-2", "team-1"),
        create_test_player_membership("player-3", "team-1"),
        create_test_player_membership("player-4", "team-1"),
        create_test_player_membership("player-5", "team-1"),
        create_test_player_membership("player-6", "team-1"),
      ];

      const membership_use_cases =
        create_mock_membership_use_cases(team_players);
      const player_use_cases = create_mock_player_use_cases(team_players);
      const player_position_use_cases = create_mock_player_position_use_cases();
      const lineup_use_cases = create_mock_lineup_use_cases([]);
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
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("has 6 active players");
      expect(result.error_message).toContain("maximum is 5");
      expect(result.fix_suggestion).toContain("Team Fixture Lineups");
    });

    it("should only include active players", async () => {
      const fixture = create_test_fixture({
        id: "fixture-1",
        competition_id: "comp-1",
      });
      const team_players = [
        create_test_player_membership("player-1", "team-1", "active"),
        create_test_player_membership("player-2", "team-1", "inactive"),
        create_test_player_membership("player-3", "team-1", "active"),
      ];

      const membership_use_cases =
        create_mock_membership_use_cases(team_players);
      const player_use_cases = create_mock_player_use_cases(team_players);
      const player_position_use_cases = create_mock_player_position_use_cases();
      const lineup_use_cases = create_mock_lineup_use_cases([]);
      const sport_use_cases = create_mock_sport_use_cases(2, 3);
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
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(true);
      expect(result.lineup?.selected_players).toHaveLength(2);
      expect(result.lineup?.selected_players?.map((p) => p.id)).not.toContain(
        "player-2",
      );
    });

    it("should use competition rule overrides instead of sport defaults", async () => {
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
      const sport_use_cases = create_mock_sport_use_cases(11, 11);
      const competition_use_cases = create_mock_competition_use_cases({
        min_players_on_field: 3,
        max_players_on_field: 5,
      });
      const organization_use_cases = create_mock_organization_use_cases();

      const result = await auto_generate_lineups_if_possible(
        fixture,
        "team-1",
        "Test Team",
        membership_use_cases,
        player_use_cases,
        player_position_use_cases,
        lineup_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(true);
      expect(result.lineup?.selected_players).toHaveLength(4);
    });

    it("should fail with competition rule overrides when player count below minimum", async () => {
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
      const sport_use_cases = create_mock_sport_use_cases(1, 99);
      const competition_use_cases = create_mock_competition_use_cases({
        min_players_on_field: 5,
        max_players_on_field: 10,
      });
      const organization_use_cases = create_mock_organization_use_cases();

      const result = await auto_generate_lineups_if_possible(
        fixture,
        "team-1",
        "Test Team",
        membership_use_cases,
        player_use_cases,
        player_position_use_cases,
        lineup_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      );

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("only 2 active player(s)");
      expect(result.error_message).toContain("minimum is 5");
    });
  });
});

function create_test_fixture(overrides: any = {}) {
  return {
    id: "fixture-1",
    home_team_id: "team-home",
    away_team_id: "team-away",
    competition_id: "comp-1",
    status: "scheduled",
    scheduled_date_time: "2024-01-01T10:00:00Z",
    venue: "",
    home_team_score: null,
    away_team_score: null,
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_test_official_assignment(
  fixture_id: string,
  official_id: string,
  role_id: string,
) {
  return {
    id: `assignment-${fixture_id}-${official_id}`,
    fixture_id,
    official_id,
    role_id,
    confirmation_status: "confirmed",
    status: "active",
    assignment_notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function create_test_lineup(
  fixture_id: string,
  team_id: string,
  status: "draft" | "submitted" | "locked",
) {
  return {
    id: `lineup-${fixture_id}-${team_id}`,
    fixture_id,
    team_id,
    selected_players: [
      {
        id: "player-1",
        first_name: "Test",
        last_name: "Player1",
        jersey_number: 1,
        position: "Forward",
        is_captain: false,
        is_substitute: false,
      },
      {
        id: "player-2",
        first_name: "Test",
        last_name: "Player2",
        jersey_number: 2,
        position: "Midfielder",
        is_captain: false,
        is_substitute: false,
      },
    ],
    status,
    submitted_by: "",
    submitted_at: status === "submitted" ? "2024-01-01" : "",
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function create_test_player_membership(
  player_id: string,
  team_id: string,
  status: "active" | "inactive" = "active",
) {
  return {
    id: `membership-${player_id}`,
    player_id,
    team_id,
    status,
    position_id: "pos-1",
    jersey_number: parseInt(player_id.replace("player-", "")) || 0,
    start_date: "2024-01-01",
    end_date: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function create_test_player(player_id: string) {
  const player_num = parseInt(player_id.replace("player-", "")) || 1;
  return {
    id: player_id,
    first_name: `Test${player_num}`,
    last_name: `Player${player_num}`,
    date_of_birth: "2000-01-01",
    nationality: "US",
    position_id: "pos-1",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function create_mock_official_use_cases(officials: any[]) {
  return {
    list_officials_for_fixture: async () => ({
      success: true,
      data: officials,
      total_count: officials.length,
    }),
  } as any;
}

function create_mock_lineup_use_cases(lineups: any[]) {
  return {
    list: async () => ({
      success: true,
      data: lineups,
      total_count: lineups.length,
    }),
    create: async (input: any) => ({
      success: true,
      data: { ...input, id: "new-lineup-id" },
    }),
  } as any;
}

function create_mock_membership_use_cases(memberships: any[]) {
  return {
    list: async () => ({
      success: true,
      data: memberships,
      total_count: memberships.length,
    }),
  } as any;
}

function create_mock_player_use_cases(memberships: any[]) {
  const players = memberships.map((m: any) => create_test_player(m.player_id));
  const player_by_id = new Map(players.map((p: any) => [p.id, p]));
  return {
    get_by_id: async (id: string) => {
      const player = player_by_id.get(id);
      return {
        success: !!player,
        data: player || null,
      };
    },
    list: async () => ({
      success: true,
      data: players,
      total_count: players.length,
    }),
  } as any;
}

function create_mock_player_position_use_cases() {
  return {
    list: async () => ({
      success: true,
      data: [
        { id: "pos-1", name: "Forward", code: "FW" },
        { id: "pos-2", name: "Midfielder", code: "MF" },
        { id: "pos-3", name: "Defender", code: "DF" },
      ],
      total_count: 3,
    }),
  } as any;
}

function create_mock_sport_use_cases(min_players: number, max_players: number) {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "sport-1",
        name: "Test Sport",
        min_players_per_fixture: min_players,
        max_players_per_fixture: max_players,
      },
    }),
  } as any;
}

function create_mock_competition_use_cases(rule_overrides: any = {}) {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "comp-1",
        name: "Test Competition",
        organization_id: "org-1",
        rule_overrides,
      },
    }),
  } as any;
}

function create_mock_organization_use_cases(sport_id: string = "sport-1") {
  return {
    get_by_id: async () => ({
      success: true,
      data: {
        id: "org-1",
        name: "Test Organization",
        sport_id,
      },
    }),
  } as any;
}
