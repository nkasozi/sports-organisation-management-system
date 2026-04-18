import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { MatchReportData } from "$lib/core/types/MatchReportTypes";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "$lib/infrastructure/utils/MatchReportBuilder";
import {
  download_all_match_reports,
  download_match_report,
} from "$lib/infrastructure/utils/MatchReportPdfGenerator";
import {
  build_assigned_officials,
  build_staff_entries,
  build_staff_roles_map,
  COMPETITION_RESULTS_MATCH_REPORT_TEXT,
  type CompetitionResultsMatchReportDependencies,
  type MatchReportCompetitionState,
  resolve_match_report_organization_name,
} from "$lib/presentation/logic/competitionResultsMatchReportHelpers";

export async function build_report_data_for_fixture(command: {
  fixture: Fixture;
  selected_competition_state: MatchReportCompetitionState;
  team_map: Map<string, Team>;
  organization_name: string;
  organization_logo_url: string;
  staff_roles_map: Map<string, string>;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<MatchReportData | undefined> {
  const {
    fixture,
    selected_competition_state,
    team_map,
    organization_name,
    organization_logo_url,
    staff_roles_map,
    dependencies,
  } = command;
  const selected_competition =
    selected_competition_state.status === "present"
      ? selected_competition_state.competition
      : void 0;
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!home_team || !away_team) return;

  const [home_lineup_result, away_lineup_result, home_staff, away_staff] =
    await Promise.all([
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.home_team_id,
      ),
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.away_team_id,
      ),
      build_staff_entries(
        fixture.home_team_id,
        staff_roles_map,
        dependencies.team_staff_use_cases,
      ),
      build_staff_entries(
        fixture.away_team_id,
        staff_roles_map,
        dependencies.team_staff_use_cases,
      ),
    ]);
  const assigned_officials = await build_assigned_officials(
    fixture,
    dependencies,
  );

  const context: MatchReportBuildContext = {
    fixture,
    home_team,
    away_team,
    competition: selected_competition,
    home_lineup:
      home_lineup_result.success && home_lineup_result.data
        ? home_lineup_result.data.selected_players
        : [],
    away_lineup:
      away_lineup_result.success && away_lineup_result.data
        ? away_lineup_result.data.selected_players
        : [],
    assigned_officials,
    home_staff,
    away_staff,
    organization_name,
    organization_logo_url,
  };

  return build_match_report_data(context);
}

export async function download_fixture_report(command: {
  fixture: Fixture;
  selected_competition_state: MatchReportCompetitionState;
  team_map: Map<string, Team>;
  organization_logo_url: string;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<boolean> {
  const {
    fixture,
    selected_competition_state,
    team_map,
    organization_logo_url,
    dependencies,
  } = command;
  const organization_name = await resolve_match_report_organization_name(
    selected_competition_state,
    dependencies,
  );
  const staff_roles_map = await build_staff_roles_map(dependencies);
  const report_data = await build_report_data_for_fixture({
    fixture,
    selected_competition_state,
    team_map,
    organization_name,
    organization_logo_url,
    staff_roles_map,
    dependencies,
  });
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!report_data || !home_team || !away_team) return false;
  download_match_report(
    report_data,
    generate_match_report_filename(
      home_team.name,
      away_team.name,
      fixture.scheduled_date,
    ),
  );
  return true;
}

export async function download_all_fixture_reports(command: {
  completed_fixtures: Fixture[];
  selected_competition_state: MatchReportCompetitionState;
  team_map: Map<string, Team>;
  organization_logo_url: string;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<boolean> {
  const {
    completed_fixtures,
    selected_competition_state,
    team_map,
    organization_logo_url,
    dependencies,
  } = command;
  if (completed_fixtures.length === 0) return false;
  const organization_name = await resolve_match_report_organization_name(
    selected_competition_state,
    dependencies,
  );
  const staff_roles_map = await build_staff_roles_map(dependencies);
  const report_data = await Promise.all(
    completed_fixtures.map((fixture: Fixture) =>
      build_report_data_for_fixture({
        fixture,
        selected_competition_state,
        team_map,
        organization_name,
        organization_logo_url,
        staff_roles_map,
        dependencies,
      }),
    ),
  );
  const valid_reports = report_data.filter(
    (item): item is MatchReportData => item != void 0,
  );
  if (valid_reports.length === 0) return false;
  download_all_match_reports(
    valid_reports,
    `${selected_competition_state.status === "present" ? selected_competition_state.competition.name : COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_competition_name}${COMPETITION_RESULTS_MATCH_REPORT_TEXT.all_reports_suffix}`,
  );
  return true;
}
