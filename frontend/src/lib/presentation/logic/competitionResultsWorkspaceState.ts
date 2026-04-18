import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "$lib/presentation/logic/competitionResultsPageContracts";
import {
  derive_effective_points_config,
  derive_effective_tie_breakers,
} from "$lib/presentation/logic/competitionResultsPageData";
import {
  calculate_player_stats,
  type CardSortMode,
  derive_stats_available_teams,
  filter_and_sort_card_players,
  filter_and_sort_scorers,
} from "$lib/presentation/logic/competitionResultsStats";
import { sort_team_fixtures } from "$lib/presentation/logic/competitionResultsTeamFixturesData";
import {
  build_competition_stage_results_sections,
  calculate_team_standings,
} from "$lib/presentation/logic/competitionStageResults";

export function derive_competition_results_workspace_state(command: {
  competition_format_state: CompetitionResultsCompetitionFormatState;
  selected_competition_state: CompetitionResultsSelectedCompetitionState;
  competition_stages: CompetitionStage[];
  fixtures: Fixture[];
  teams: Team[];
  team_map: Map<string, Team>;
  upcoming_page: number;
  upcoming_per_page: number;
  results_page: number;
  results_per_page: number;
  stats_team_filter: string;
  stats_card_sort: CardSortMode;
  team_fixtures_in_competition: Fixture[];
  team_fixtures_all_competitions: Fixture[];
  show_all_competitions_fixtures: boolean;
  team_fixtures_page: number;
  team_fixtures_per_page: number;
}): {
  effective_points_config: ReturnType<typeof derive_effective_points_config>;
  effective_tie_breakers: ReturnType<typeof derive_effective_tie_breakers>;
  standings: ReturnType<typeof calculate_team_standings>;
  stage_results_sections: ReturnType<
    typeof build_competition_stage_results_sections
  >;
  competition_stage_map: Map<string, CompetitionStage>;
  completed_fixtures: Fixture[];
  upcoming_fixtures: Fixture[];
  live_team_ids: Set<string>;
  upcoming_total_pages: number;
  paginated_upcoming: Fixture[];
  results_total_pages: number;
  paginated_completed: Fixture[];
  stats_available_teams: string[];
  stats_filtered_scorers: ReturnType<typeof filter_and_sort_scorers>;
  stats_filtered_card_players: ReturnType<typeof filter_and_sort_card_players>;
  displayed_team_fixtures: Fixture[];
  sorted_team_fixtures: Fixture[];
  team_fixtures_total_pages: number;
  paginated_team_fixtures: Fixture[];
} {
  const effective_points_config = derive_effective_points_config(
    command.competition_format_state,
    command.selected_competition_state,
  );
  const effective_tie_breakers = derive_effective_tie_breakers(
    command.competition_format_state,
    command.selected_competition_state,
  );
  const standings = calculate_team_standings(
    command.fixtures,
    command.teams,
    effective_points_config,
    effective_tie_breakers,
  );
  const stage_results_sections = build_competition_stage_results_sections(
    command.competition_stages,
    command.fixtures,
    command.teams,
    effective_points_config,
    effective_tie_breakers,
  );
  const competition_stage_map = new Map(
    command.competition_stages.map((stage: CompetitionStage) => [
      stage.id,
      stage,
    ]),
  );
  const completed_fixtures = command.fixtures.filter(
    (fixture: Fixture) => fixture.status === "completed",
  );
  const upcoming_fixtures = command.fixtures.filter(
    (fixture: Fixture) =>
      fixture.status === "scheduled" || fixture.status === "in_progress",
  );
  const live_team_ids = new Set(
    command.fixtures
      .filter((fixture: Fixture) => fixture.status === "in_progress")
      .flatMap((fixture: Fixture) => [
        fixture.home_team_id,
        fixture.away_team_id,
      ]),
  );
  const upcoming_total_pages = Math.max(
    1,
    Math.ceil(upcoming_fixtures.length / command.upcoming_per_page),
  );
  const paginated_upcoming = upcoming_fixtures.slice(
    (command.upcoming_page - 1) * command.upcoming_per_page,
    command.upcoming_page * command.upcoming_per_page,
  );
  const results_total_pages = Math.max(
    1,
    Math.ceil(completed_fixtures.length / command.results_per_page),
  );
  const paginated_completed = completed_fixtures.slice(
    (command.results_page - 1) * command.results_per_page,
    command.results_page * command.results_per_page,
  );
  const player_stats = calculate_player_stats(
    command.fixtures,
    command.team_map,
  );
  const stats_available_teams = derive_stats_available_teams(player_stats);
  const stats_filtered_scorers = filter_and_sort_scorers(
    player_stats,
    command.stats_team_filter,
  );
  const stats_filtered_card_players = filter_and_sort_card_players(
    player_stats,
    command.stats_team_filter,
    command.stats_card_sort,
  );
  const displayed_team_fixtures = command.show_all_competitions_fixtures
    ? command.team_fixtures_all_competitions
    : command.team_fixtures_in_competition;
  const sorted_team_fixtures = sort_team_fixtures(displayed_team_fixtures);
  const team_fixtures_total_pages = Math.max(
    1,
    Math.ceil(sorted_team_fixtures.length / command.team_fixtures_per_page),
  );
  const paginated_team_fixtures = sorted_team_fixtures.slice(
    (command.team_fixtures_page - 1) * command.team_fixtures_per_page,
    command.team_fixtures_page * command.team_fixtures_per_page,
  );

  return {
    effective_points_config,
    effective_tie_breakers,
    standings,
    stage_results_sections,
    competition_stage_map,
    completed_fixtures,
    upcoming_fixtures,
    live_team_ids,
    upcoming_total_pages,
    paginated_upcoming,
    results_total_pages,
    paginated_completed,
    stats_available_teams,
    stats_filtered_scorers,
    stats_filtered_card_players,
    displayed_team_fixtures,
    sorted_team_fixtures,
    team_fixtures_total_pages,
    paginated_team_fixtures,
  };
}
