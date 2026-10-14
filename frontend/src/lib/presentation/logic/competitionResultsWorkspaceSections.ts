import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  derive_effective_points_config,
  derive_effective_tie_breakers,
} from "$lib/presentation/logic/competitionResultsPageData";
import {
  calculate_player_stats,
  derive_stats_available_teams,
  filter_and_sort_card_players,
  filter_and_sort_scorers,
} from "$lib/presentation/logic/competitionResultsStats";
import { sort_team_fixtures } from "$lib/presentation/logic/competitionResultsTeamFixturesData";
import type {
  CompetitionResultsWorkspaceStateCommand,
  FixturesSection,
  StandingsSection,
  StatsSection,
  TeamFixturesSection,
} from "$lib/presentation/logic/competitionResultsWorkspaceStateTypes";
import {
  build_competition_stage_results_sections,
  calculate_team_standings,
} from "$lib/presentation/logic/competitionStageResults";

function calculate_total_pages(item_count: number, per_page: number): number {
  return Math.max(1, Math.ceil(item_count / per_page));
}

function paginate_fixtures(
  fixtures: Fixture[],
  page: number,
  per_page: number,
): Fixture[] {
  return fixtures.slice((page - 1) * per_page, page * per_page);
}

export function derive_competition_results_standings_section(
  command: CompetitionResultsWorkspaceStateCommand,
): StandingsSection {
  const effective_points_config = derive_effective_points_config(
    command.competition_format_state,
    command.selected_competition_state,
  );
  const effective_tie_breakers = derive_effective_tie_breakers(
    command.competition_format_state,
    command.selected_competition_state,
  );
  return {
    effective_points_config,
    effective_tie_breakers,
    standings: calculate_team_standings(
      command.fixtures,
      command.teams,
      effective_points_config,
      effective_tie_breakers,
      command.sport_rules.fair_play_card_weights,
    ),
    stage_results_sections: build_competition_stage_results_sections(
      command.competition_stages,
      command.fixtures,
      command.teams,
      effective_points_config,
      effective_tie_breakers,
      command.sport_rules.fair_play_card_weights,
    ),
    competition_stage_map: new Map(
      command.competition_stages.map((stage: CompetitionStage) => [
        stage.id,
        stage,
      ]),
    ),
  };
}

function derive_live_team_ids(fixtures: Fixture[]): Set<string> {
  return new Set(
    fixtures
      .filter(
        (fixture: Fixture) => fixture.status === FIXTURE_STATUS.IN_PROGRESS,
      )
      .flatMap((fixture: Fixture) => [
        fixture.home_team_id,
        fixture.away_team_id,
      ]),
  );
}

export function derive_competition_results_fixtures_section(
  command: CompetitionResultsWorkspaceStateCommand,
): FixturesSection {
  const completed_fixtures = command.fixtures.filter(
    (fixture: Fixture) => fixture.status === FIXTURE_STATUS.COMPLETED,
  );
  const upcoming_fixtures = command.fixtures.filter(
    (fixture: Fixture) =>
      fixture.status === FIXTURE_STATUS.SCHEDULED ||
      fixture.status === FIXTURE_STATUS.IN_PROGRESS,
  );
  return {
    completed_fixtures,
    upcoming_fixtures,
    live_team_ids: derive_live_team_ids(command.fixtures),
    upcoming_total_pages: calculate_total_pages(
      upcoming_fixtures.length,
      command.upcoming_per_page,
    ),
    paginated_upcoming: paginate_fixtures(
      upcoming_fixtures,
      command.upcoming_page,
      command.upcoming_per_page,
    ),
    results_total_pages: calculate_total_pages(
      completed_fixtures.length,
      command.results_per_page,
    ),
    paginated_completed: paginate_fixtures(
      completed_fixtures,
      command.results_page,
      command.results_per_page,
    ),
  };
}

export function derive_competition_results_stats_section(
  command: CompetitionResultsWorkspaceStateCommand,
): StatsSection {
  const player_stats = calculate_player_stats(
    command.fixtures,
    command.team_map,
    create_score_award_resolver(command.sport_rules.event_source.scoring_rules),
  );
  return {
    stats_available_teams: derive_stats_available_teams(player_stats),
    stats_filtered_scorers: filter_and_sort_scorers(
      player_stats,
      command.stats_team_filter,
    ),
    stats_filtered_card_players: filter_and_sort_card_players(
      player_stats,
      command.stats_team_filter,
      command.stats_card_sort,
    ),
  };
}

export function derive_competition_results_team_fixtures_section(
  command: CompetitionResultsWorkspaceStateCommand,
): TeamFixturesSection {
  const displayed_team_fixtures = command.show_all_competitions_fixtures
    ? command.team_fixtures_all_competitions
    : command.team_fixtures_in_competition;
  const sorted_team_fixtures = sort_team_fixtures(displayed_team_fixtures);
  return {
    displayed_team_fixtures,
    sorted_team_fixtures,
    team_fixtures_total_pages: calculate_total_pages(
      sorted_team_fixtures.length,
      command.team_fixtures_per_page,
    ),
    paginated_team_fixtures: paginate_fixtures(
      sorted_team_fixtures,
      command.team_fixtures_page,
      command.team_fixtures_per_page,
    ),
  };
}
