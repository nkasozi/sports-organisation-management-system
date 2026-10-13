import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "$lib/infrastructure/utils/MatchReportBuilder";
import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";

import {
  load_match_report_team_staff,
  type MatchReportPageDownloadDependencies,
  type MatchReportTeamStaff,
} from "./matchReportPageDownloadStaff";
import type {
  MatchReportAssignedOfficialData,
  MatchReportCompetitionState,
  MatchReportSportState,
  MatchReportVenueState,
} from "./matchReportPageLoadTypes";
import {
  MATCH_REPORT_EVENT,
  MATCH_REPORT_MESSAGE,
} from "./matchReportPageMessages";
import { build_match_report_sport_rules } from "./matchReportSportRules";
import { PRESENCE_STATUS } from "./presenceStatus";

export interface MatchReportDownloadCommand {
  fixture: Fixture;
  home_team: Team;
  away_team: Team;
  competition_state: MatchReportCompetitionState;
  sport_state: MatchReportSportState;
  venue_state: MatchReportVenueState;
  assigned_officials_data: MatchReportAssignedOfficialData[];
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  organization_logo_url: string;
  dependencies: MatchReportPageDownloadDependencies;
}

async function load_match_report_organization_name(
  competition_state: MatchReportCompetitionState,
  dependencies: MatchReportPageDownloadDependencies,
): Promise<string> {
  if (
    competition_state.status === PRESENCE_STATUS.MISSING ||
    !competition_state.competition.organization_id
  ) {
    return MATCH_REPORT_MESSAGE.DEFAULT_ORGANIZATION_NAME;
  }

  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition_state.competition.organization_id,
    );
  if (!organization_result.success || !organization_result.data) {
    console.warn("[MatchReport] Organization name unavailable", {
      event: MATCH_REPORT_EVENT.ORGANIZATION_NAME_UNAVAILABLE,
      organization_id: competition_state.competition.organization_id,
    });
    return MATCH_REPORT_MESSAGE.DEFAULT_ORGANIZATION_NAME;
  }

  return organization_result.data.name.toUpperCase();
}

function build_match_report_download_context(
  command: MatchReportDownloadCommand,
  organization_name: string,
  team_staff: MatchReportTeamStaff,
): MatchReportBuildContext {
  return {
    fixture: command.fixture,
    home_team: command.home_team,
    away_team: command.away_team,
    competition:
      command.competition_state.status === PRESENCE_STATUS.PRESENT
        ? command.competition_state.competition
        : void 0,
    home_lineup: command.home_players,
    away_lineup: command.away_players,
    assigned_officials: command.assigned_officials_data,
    home_staff: team_staff.home_staff,
    away_staff: team_staff.away_staff,
    ...build_match_report_sport_rules(
      command.sport_state.status === PRESENCE_STATUS.PRESENT
        ? command.sport_state.sport
        : void 0,
      command.competition_state.status === PRESENCE_STATUS.PRESENT
        ? command.competition_state.competition
        : void 0,
    ),
    organization_name,
    venue_name:
      command.venue_state.status === PRESENCE_STATUS.PRESENT
        ? command.venue_state.venue.name
        : void 0,
    organization_logo_url: command.organization_logo_url,
  };
}

async function generate_and_download_match_report(
  command: MatchReportDownloadCommand,
): AsyncResult<string> {
  const organization_name = await load_match_report_organization_name(
    command.competition_state,
    command.dependencies,
  );
  const team_staff = await load_match_report_team_staff(
    command.fixture,
    command.dependencies,
  );
  const report_data = build_match_report_data(
    build_match_report_download_context(command, organization_name, team_staff),
  );
  const filename = generate_match_report_filename(
    command.home_team.name,
    command.away_team.name,
    command.fixture.scheduled_date,
  );
  const download_result = download_match_report(report_data, filename);
  if (!download_result.success) {
    console.error("[MatchReport] PDF save failed", {
      event: MATCH_REPORT_EVENT.SAVE_FAILED,
      fixture_id: command.fixture.id,
      error: download_result.error,
    });
    return create_failure_result(MATCH_REPORT_MESSAGE.DOWNLOAD_FAILED);
  }
  return create_success_result(MATCH_REPORT_MESSAGE.DOWNLOAD_SUCCEEDED);
}

export async function download_match_report_for_fixture(
  command: MatchReportDownloadCommand,
): AsyncResult<string> {
  try {
    return await generate_and_download_match_report(command);
  } catch (error) {
    console.error("[MatchReport] Download failed", {
      event: MATCH_REPORT_EVENT.DOWNLOAD_FAILED,
      fixture_id: command.fixture.id,
      error: String(error),
    });
    return create_failure_result(MATCH_REPORT_MESSAGE.DOWNLOAD_FAILED);
  }
}
