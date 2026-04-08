import { describe, expect, it, vi } from "vitest";

const fixture_lineup_create_data_type_mocks = vi.hoisted(() => ({
  get_competition_team_use_cases: vi.fn(),
  get_competition_use_cases: vi.fn(),
  get_fixture_lineup_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_player_position_use_cases: vi.fn(),
  get_player_team_membership_use_cases: vi.fn(),
  get_player_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_team_use_cases:
    fixture_lineup_create_data_type_mocks.get_competition_team_use_cases,
  get_competition_use_cases:
    fixture_lineup_create_data_type_mocks.get_competition_use_cases,
  get_fixture_lineup_use_cases:
    fixture_lineup_create_data_type_mocks.get_fixture_lineup_use_cases,
  get_fixture_use_cases:
    fixture_lineup_create_data_type_mocks.get_fixture_use_cases,
  get_organization_use_cases:
    fixture_lineup_create_data_type_mocks.get_organization_use_cases,
  get_player_position_use_cases:
    fixture_lineup_create_data_type_mocks.get_player_position_use_cases,
  get_player_team_membership_use_cases:
    fixture_lineup_create_data_type_mocks.get_player_team_membership_use_cases,
  get_player_use_cases:
    fixture_lineup_create_data_type_mocks.get_player_use_cases,
  get_team_use_cases: fixture_lineup_create_data_type_mocks.get_team_use_cases,
}));

import { create_fixture_lineup_create_dependencies } from "./fixtureLineupCreateDataTypes";

describe("fixtureLineupCreateDataTypes", () => {
  it("builds lineup-create dependencies from use-case factories", () => {
    const expected_dependencies = {
      lineup_use_cases: { kind: "lineups" },
      fixture_use_cases: { kind: "fixtures" },
      team_use_cases: { kind: "teams" },
      player_use_cases: { kind: "players" },
      competition_use_cases: { kind: "competitions" },
      competition_team_use_cases: { kind: "competition-teams" },
      membership_use_cases: { kind: "memberships" },
      player_position_use_cases: { kind: "player-positions" },
      organization_use_cases: { kind: "organizations" },
    };
    fixture_lineup_create_data_type_mocks.get_fixture_lineup_use_cases.mockReturnValue(
      expected_dependencies.lineup_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_fixture_use_cases.mockReturnValue(
      expected_dependencies.fixture_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_team_use_cases.mockReturnValue(
      expected_dependencies.team_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_player_use_cases.mockReturnValue(
      expected_dependencies.player_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_competition_team_use_cases.mockReturnValue(
      expected_dependencies.competition_team_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_player_team_membership_use_cases.mockReturnValue(
      expected_dependencies.membership_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_player_position_use_cases.mockReturnValue(
      expected_dependencies.player_position_use_cases,
    );
    fixture_lineup_create_data_type_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );

    expect(create_fixture_lineup_create_dependencies()).toEqual(
      expected_dependencies,
    );
  });
});
