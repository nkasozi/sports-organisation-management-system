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
  build_staff_roles_map,
  COMPETITION_RESULTS_MATCH_REPORT_TEXT,
  type CompetitionResultsMatchReportDependencies,
  type MatchReportCompetitionState,
  resolve_match_report_organization_name,
} from "$lib/presentation/logic/competitionResultsMatchReportHelpers";
import { fetch_match_report_participants } from "$lib/presentation/logic/competitionResultsMatchReportParticipants";
import type { MatchReportSportRules } from "$lib/presentation/logic/matchReportSportRules";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

interface MatchReportFixtureCommand {
  fixture: Fixture;
  selected_competition_state: MatchReportCompetitionState;
  sport_rules: MatchReportSportRules;
  team_map: Map<string, Team>;
  organization_name: string;
  organization_logo_url: string;
  staff_roles_map: Map<string, string>;
  dependencies: CompetitionResultsMatchReportDependencies;
}

interface MatchReportDownloadCommand {
  selected_competition_state: MatchReportCompetitionState;
  sport_rules: MatchReportSportRules;
  team_map: Map<string, Team>;
  organization_logo_url: string;
  dependencies: CompetitionResultsMatchReportDependencies;
}

export async function build_report_data_for_fixture(
  command: MatchReportFixtureCommand,
): Promise<MatchReportData | undefined> {
  const { fixture, selected_competition_state, team_map } = command;
  const selected_competition =
    selected_competition_state.status === PRESENCE_STATUS.PRESENT
      ? selected_competition_state.competition
      : void 0;
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!home_team || !away_team) return;

  const participants = await fetch_match_report_participants(
    fixture,
    command.staff_roles_map,
    command.dependencies,
  );

  const context: MatchReportBuildContext = {
    fixture,
    home_team,
    away_team,
    competition: selected_competition,
    ...command.sport_rules,
    ...participants,
    organization_name: command.organization_name,
    organization_logo_url: command.organization_logo_url,
  };

  return build_match_report_data(context);
}

async function build_match_report_fixture_commands(
  command: MatchReportDownloadCommand,
): Promise<Omit<MatchReportFixtureCommand, "fixture">> {
  const organization_name = await resolve_match_report_organization_name(
    command.selected_competition_state,
    command.dependencies,
  );
  const staff_roles_map = await build_staff_roles_map(command.dependencies);
  return {
    selected_competition_state: command.selected_competition_state,
    sport_rules: command.sport_rules,
    team_map: command.team_map,
    organization_name,
    organization_logo_url: command.organization_logo_url,
    staff_roles_map,
    dependencies: command.dependencies,
  };
}

const COMPETITION_RESULTS_REPORT_EVENTS = {
  REPORT_DOWNLOAD_FAILED: "competition_results_match_report_download_failed",
  ALL_REPORTS_DOWNLOAD_FAILED:
    "competition_results_all_match_reports_download_failed",
} as const;

export async function download_fixture_report(
  command: MatchReportDownloadCommand & { fixture: Fixture },
): Promise<boolean> {
  const { fixture, team_map } = command;
  const shared_command = await build_match_report_fixture_commands(command);
  const report_data = await build_report_data_for_fixture({
    ...shared_command,
    fixture,
  });
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!report_data || !home_team || !away_team) return false;
  const download_result = download_match_report(
    report_data,
    generate_match_report_filename(
      home_team.name,
      away_team.name,
      fixture.scheduled_date,
    ),
  );
  if (download_result.success) return true;
  console.error("[CompetitionResults] Match report download failed", {
    event: COMPETITION_RESULTS_REPORT_EVENTS.REPORT_DOWNLOAD_FAILED,
    fixture_id: fixture.id,
    error: download_result.error,
  });
  return false;
}

function build_all_match_reports_filename(
  selected_competition_state: MatchReportCompetitionState,
): string {
  const competition_name =
    selected_competition_state.status === PRESENCE_STATUS.PRESENT
      ? selected_competition_state.competition.name
      : COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_competition_name;
  return `${competition_name}${COMPETITION_RESULTS_MATCH_REPORT_TEXT.all_reports_suffix}`;
}

export async function download_all_fixture_reports(
  command: MatchReportDownloadCommand & { completed_fixtures: Fixture[] },
): Promise<boolean> {
  if (command.completed_fixtures.length === 0) return false;
  const shared_command = await build_match_report_fixture_commands(command);
  const report_data = await Promise.all(
    command.completed_fixtures.map((fixture: Fixture) =>
      build_report_data_for_fixture({ ...shared_command, fixture }),
    ),
  );
  const valid_reports = report_data.filter(
    (item): item is MatchReportData => item != void 0,
  );
  if (valid_reports.length === 0) return false;
  const download_result = download_all_match_reports(
    valid_reports,
    build_all_match_reports_filename(command.selected_competition_state),
  );
  if (download_result.success) return true;
  console.error("[CompetitionResults] All match reports download failed", {
    event: COMPETITION_RESULTS_REPORT_EVENTS.ALL_REPORTS_DOWNLOAD_FAILED,
    fixture_count: valid_reports.length,
    error: download_result.error,
  });
  return false;
}
