import { describe, expect, it, vi } from "vitest";

const live_games_page_dependency_mocks = vi.hoisted(() => ({
  get_authorization_adapter: vi.fn(),
  get_competition_use_cases: vi.fn(),
  get_fixture_details_setup_use_cases: vi.fn(),
  get_fixture_lineup_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_game_official_role_use_cases: vi.fn(),
  get_jersey_color_use_cases: vi.fn(),
  get_official_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_player_position_use_cases: vi.fn(),
  get_player_team_membership_use_cases: vi.fn(),
  get_player_use_cases: vi.fn(),
  get_sport_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter:
    live_games_page_dependency_mocks.get_authorization_adapter,
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_use_cases:
    live_games_page_dependency_mocks.get_competition_use_cases,
  get_fixture_details_setup_use_cases:
    live_games_page_dependency_mocks.get_fixture_details_setup_use_cases,
  get_fixture_lineup_use_cases:
    live_games_page_dependency_mocks.get_fixture_lineup_use_cases,
  get_fixture_use_cases: live_games_page_dependency_mocks.get_fixture_use_cases,
  get_game_official_role_use_cases:
    live_games_page_dependency_mocks.get_game_official_role_use_cases,
  get_jersey_color_use_cases:
    live_games_page_dependency_mocks.get_jersey_color_use_cases,
  get_official_use_cases:
    live_games_page_dependency_mocks.get_official_use_cases,
  get_organization_use_cases:
    live_games_page_dependency_mocks.get_organization_use_cases,
  get_player_position_use_cases:
    live_games_page_dependency_mocks.get_player_position_use_cases,
  get_player_team_membership_use_cases:
    live_games_page_dependency_mocks.get_player_team_membership_use_cases,
  get_player_use_cases: live_games_page_dependency_mocks.get_player_use_cases,
  get_sport_use_cases: live_games_page_dependency_mocks.get_sport_use_cases,
  get_team_use_cases: live_games_page_dependency_mocks.get_team_use_cases,
}));

describe("liveGamesPageDependencies", () => {
  it("assembles live-game dependencies and polling delay from adapter and factory outputs", async () => {
    vi.resetModules();
    const expected_dependencies = {
      authorization_adapter: { kind: "authorization" },
      fixture_use_cases: { kind: "fixtures" },
      fixture_details_setup_use_cases: { kind: "fixture-details-setup" },
      fixture_lineup_use_cases: { kind: "fixture-lineups" },
      membership_use_cases: { kind: "memberships" },
      player_use_cases: { kind: "players" },
      player_position_use_cases: { kind: "player-positions" },
      team_use_cases: { kind: "teams" },
      sport_use_cases: { kind: "sports" },
      competition_use_cases: { kind: "competitions" },
      organization_use_cases: { kind: "organizations" },
      jersey_color_use_cases: { kind: "jersey-colors" },
      official_use_cases: { kind: "officials" },
      game_official_role_use_cases: { kind: "game-official-roles" },
      check_delay_ms: 800,
    };
    live_games_page_dependency_mocks.get_authorization_adapter.mockReturnValue(
      expected_dependencies.authorization_adapter,
    );
    live_games_page_dependency_mocks.get_fixture_use_cases.mockReturnValue(
      expected_dependencies.fixture_use_cases,
    );
    live_games_page_dependency_mocks.get_fixture_details_setup_use_cases.mockReturnValue(
      expected_dependencies.fixture_details_setup_use_cases,
    );
    live_games_page_dependency_mocks.get_fixture_lineup_use_cases.mockReturnValue(
      expected_dependencies.fixture_lineup_use_cases,
    );
    live_games_page_dependency_mocks.get_player_team_membership_use_cases.mockReturnValue(
      expected_dependencies.membership_use_cases,
    );
    live_games_page_dependency_mocks.get_player_use_cases.mockReturnValue(
      expected_dependencies.player_use_cases,
    );
    live_games_page_dependency_mocks.get_player_position_use_cases.mockReturnValue(
      expected_dependencies.player_position_use_cases,
    );
    live_games_page_dependency_mocks.get_team_use_cases.mockReturnValue(
      expected_dependencies.team_use_cases,
    );
    live_games_page_dependency_mocks.get_sport_use_cases.mockReturnValue(
      expected_dependencies.sport_use_cases,
    );
    live_games_page_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    live_games_page_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );
    live_games_page_dependency_mocks.get_jersey_color_use_cases.mockReturnValue(
      expected_dependencies.jersey_color_use_cases,
    );
    live_games_page_dependency_mocks.get_official_use_cases.mockReturnValue(
      expected_dependencies.official_use_cases,
    );
    live_games_page_dependency_mocks.get_game_official_role_use_cases.mockReturnValue(
      expected_dependencies.game_official_role_use_cases,
    );

    const { live_games_page_dependencies } =
      await import("./liveGamesPageDependencies");

    expect(live_games_page_dependencies).toEqual(expected_dependencies);
  });
});
