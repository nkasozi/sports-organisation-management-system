import type { Fixture } from "../entities/Fixture";
import type { FixtureLineup } from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";

export type TestOfficialAssignment = Record<string, string>;

export function create_test_fixture(
  overrides: Record<string, unknown> = {},
): Fixture {
  return {
    id: "fixture-1",
    home_team_id: "team-home",
    away_team_id: "team-away",
    competition_id: "comp-1",
    status: "scheduled",
    scheduled_date_time: "2024-01-01T10:00:00Z",
    venue: "",
    home_team_score: 0,
    away_team_score: 0,
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

export function create_test_official_assignment(
  fixture_id: string,
  official_id: string,
  role_id: string,
): TestOfficialAssignment {
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

export function create_test_lineup(
  fixture_id: string,
  team_id: string,
  status: "draft" | "submitted" | "locked",
): FixtureLineup {
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
  } as unknown as FixtureLineup;
}

export function create_test_player_membership(
  player_id: string,
  team_id: string,
  status: "active" | "inactive" = "active",
): PlayerTeamMembership {
  return {
    id: `membership-${player_id}`,
    player_id,
    team_id,
    status,
    position_id: "pos-1",
    jersey_number: parseInt(player_id.replace("player-", "")) || 0,
    start_date: "2024-01-01",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  } as unknown as PlayerTeamMembership;
}

export function create_test_player(player_id: string): Player {
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
  } as unknown as Player;
}
