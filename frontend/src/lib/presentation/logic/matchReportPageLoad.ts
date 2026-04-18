import type { Team } from "$lib/core/entities/Team";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  load_match_report_assigned_officials,
  load_match_report_competition_bundle,
  load_match_report_lineups,
} from "$lib/presentation/logic/matchReportPageLoadHelpers";
import type {
  MatchReportPageData,
  MatchReportPageDependencies,
  MatchReportRefreshData,
  MatchReportRefreshDependencies,
  MatchReportTeamState,
} from "$lib/presentation/logic/matchReportPageLoadTypes";

const MATCH_REPORT_PAGE_LOAD_MESSAGE = {
  fixture_not_found: "Failed to load match",
} as const;

function build_match_report_team_state(
  team_result: Result<Team>,
): MatchReportTeamState {
  if (!team_result.success || !team_result.data) {
    return { status: "missing" };
  }

  return { status: "present", team: team_result.data };
}

export async function load_match_report_page_data(command: {
  fixture_id: string;
  dependencies: MatchReportPageDependencies;
}): AsyncResult<MatchReportPageData> {
  const fixture_result = await command.dependencies.fixture_use_cases.get_by_id(
    command.fixture_id,
  );
  if (!fixture_result.success || !fixture_result.data) {
    return create_failure_result(
      fixture_result.success
        ? MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found
        : fixture_result.error ||
            MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found,
    );
  }

  const fixture = fixture_result.data;
  const [
    home_team_result,
    away_team_result,
    lineups,
    competition_bundle,
    assigned_officials_bundle,
  ] = await Promise.all([
    command.dependencies.team_use_cases.get_by_id(fixture.home_team_id),
    command.dependencies.team_use_cases.get_by_id(fixture.away_team_id),
    load_match_report_lineups(fixture, command.dependencies),
    load_match_report_competition_bundle(fixture, command.dependencies),
    load_match_report_assigned_officials(fixture, command.dependencies),
  ]);

  return create_success_result({
    fixture,
    home_team_state: build_match_report_team_state(home_team_result),
    away_team_state: build_match_report_team_state(away_team_result),
    competition_state: competition_bundle.competition_state,
    sport_state: competition_bundle.sport_state,
    venue_state: assigned_officials_bundle.venue_state,
    organization_name: competition_bundle.organization_name,
    assigned_officials_data: assigned_officials_bundle.assigned_officials_data,
    home_players: lineups.home_players,
    away_players: lineups.away_players,
  });
}

export async function refresh_match_report_fixture_data(command: {
  fixture_id: string;
  dependencies: MatchReportRefreshDependencies;
}): AsyncResult<MatchReportRefreshData> {
  const fixture_result = await command.dependencies.fixture_use_cases.get_by_id(
    command.fixture_id,
  );
  if (!fixture_result.success || !fixture_result.data) {
    return create_failure_result(
      fixture_result.success
        ? MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found
        : fixture_result.error ||
            MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found,
    );
  }

  const lineups = await load_match_report_lineups(
    fixture_result.data,
    command.dependencies,
  );

  return create_success_result({
    fixture: fixture_result.data,
    home_players: lineups.home_players,
    away_players: lineups.away_players,
  });
}
