import { beforeEach, describe, expect, it, vi } from "vitest";

import { derive_competition_results_workspace_state } from "./competitionResultsWorkspaceState";

const competition_results_workspace_state_mocks = vi.hoisted(() => ({
  build_competition_stage_results_sections: vi.fn(),
  calculate_player_stats: vi.fn(),
  calculate_team_standings: vi.fn(),
  derive_effective_points_config: vi.fn(),
  derive_effective_tie_breakers: vi.fn(),
  derive_stats_available_teams: vi.fn(),
  filter_and_sort_card_players: vi.fn(),
  filter_and_sort_scorers: vi.fn(),
  sort_team_fixtures: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionResultsPageData", () => ({
  derive_effective_points_config:
    competition_results_workspace_state_mocks.derive_effective_points_config,
  derive_effective_tie_breakers:
    competition_results_workspace_state_mocks.derive_effective_tie_breakers,
}));

vi.mock("$lib/presentation/logic/competitionResultsStats", () => ({
  calculate_player_stats:
    competition_results_workspace_state_mocks.calculate_player_stats,
  derive_stats_available_teams:
    competition_results_workspace_state_mocks.derive_stats_available_teams,
  filter_and_sort_card_players:
    competition_results_workspace_state_mocks.filter_and_sort_card_players,
  filter_and_sort_scorers:
    competition_results_workspace_state_mocks.filter_and_sort_scorers,
}));

vi.mock("$lib/presentation/logic/competitionResultsTeamFixturesData", () => ({
  sort_team_fixtures:
    competition_results_workspace_state_mocks.sort_team_fixtures,
}));

vi.mock("$lib/presentation/logic/competitionStageResults", () => ({
  build_competition_stage_results_sections:
    competition_results_workspace_state_mocks.build_competition_stage_results_sections,
  calculate_team_standings:
    competition_results_workspace_state_mocks.calculate_team_standings,
}));

describe("competitionResultsWorkspaceState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    competition_results_workspace_state_mocks.derive_effective_points_config.mockReturnValue(
      { points_for_win: 3 },
    );
    competition_results_workspace_state_mocks.derive_effective_tie_breakers.mockReturnValue(
      ["goal_difference"],
    );
    competition_results_workspace_state_mocks.calculate_team_standings.mockReturnValue(
      [{ team_id: "team-1" }],
    );
    competition_results_workspace_state_mocks.build_competition_stage_results_sections.mockReturnValue(
      [{ id: "section-1" }],
    );
    competition_results_workspace_state_mocks.calculate_player_stats.mockReturnValue(
      [{ player_id: "player-1" }],
    );
    competition_results_workspace_state_mocks.derive_stats_available_teams.mockReturnValue(
      ["Lions"],
    );
    competition_results_workspace_state_mocks.filter_and_sort_scorers.mockReturnValue(
      [{ player_id: "player-1" }],
    );
    competition_results_workspace_state_mocks.filter_and_sort_card_players.mockReturnValue(
      [{ player_id: "player-2" }],
    );
  });

  it("derives paginated competition results, live teams, and stats collections", () => {
    const scheduled_fixture = {
      id: "fixture-1",
      status: "scheduled",
      home_team_id: "team-1",
      away_team_id: "team-2",
    };
    const live_fixture = {
      id: "fixture-2",
      status: "in_progress",
      home_team_id: "team-3",
      away_team_id: "team-4",
    };
    const completed_fixture = {
      id: "fixture-3",
      status: "completed",
      home_team_id: "team-1",
      away_team_id: "team-3",
    };
    const sorted_team_fixtures = [live_fixture, scheduled_fixture];
    competition_results_workspace_state_mocks.sort_team_fixtures.mockReturnValue(
      sorted_team_fixtures,
    );

    expect(
      derive_competition_results_workspace_state({
        competition_format_state: { status: "missing" },
        selected_competition_state: {
          status: "present",
          competition: { id: "competition-1" },
        },
        competition_stages: [{ id: "stage-1" }],
        fixtures: [scheduled_fixture, live_fixture, completed_fixture],
        teams: [{ id: "team-1" }],
        team_map: new Map([["team-1", { id: "team-1", name: "Lions" }]]),
        upcoming_page: 1,
        upcoming_per_page: 1,
        results_page: 1,
        results_per_page: 1,
        stats_team_filter: "",
        stats_card_sort: "red_first",
        team_fixtures_in_competition: [scheduled_fixture],
        team_fixtures_all_competitions: [scheduled_fixture, live_fixture],
        show_all_competitions_fixtures: true,
        team_fixtures_page: 1,
        team_fixtures_per_page: 1,
      } as never),
    ).toEqual({
      effective_points_config: { points_for_win: 3 },
      effective_tie_breakers: ["goal_difference"],
      standings: [{ team_id: "team-1" }],
      stage_results_sections: [{ id: "section-1" }],
      competition_stage_map: new Map([["stage-1", { id: "stage-1" }]]),
      completed_fixtures: [completed_fixture],
      upcoming_fixtures: [scheduled_fixture, live_fixture],
      live_team_ids: new Set(["team-3", "team-4"]),
      upcoming_total_pages: 2,
      paginated_upcoming: [scheduled_fixture],
      results_total_pages: 1,
      paginated_completed: [completed_fixture],
      stats_available_teams: ["Lions"],
      stats_filtered_scorers: [{ player_id: "player-1" }],
      stats_filtered_card_players: [{ player_id: "player-2" }],
      displayed_team_fixtures: [scheduled_fixture, live_fixture],
      sorted_team_fixtures: sorted_team_fixtures,
      team_fixtures_total_pages: 2,
      paginated_team_fixtures: [live_fixture],
    });
  });
});
