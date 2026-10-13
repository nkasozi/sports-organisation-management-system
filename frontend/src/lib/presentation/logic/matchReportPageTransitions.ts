import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type { MatchReportDownloadCommand } from "./matchReportPageDownload";
import type {
  MatchReportPageDataState,
  MatchReportRefreshData,
} from "./matchReportPageLoadTypes";
import { MATCH_REPORT_MESSAGE } from "./matchReportPageMessages";
import { PRESENCE_STATUS } from "./presenceStatus";

type MatchReportDownloadRequest = Omit<
  MatchReportDownloadCommand,
  "dependencies"
>;

export function apply_match_report_refresh_data(
  page_data_state: MatchReportPageDataState,
  refresh_data: MatchReportRefreshData,
): MatchReportPageDataState {
  if (page_data_state.status === PRESENCE_STATUS.MISSING)
    return page_data_state;
  return {
    status: PRESENCE_STATUS.PRESENT,
    page_data: {
      ...page_data_state.page_data,
      fixture: refresh_data.fixture,
      home_players: refresh_data.home_players,
      away_players: refresh_data.away_players,
    },
  };
}

export function build_match_report_download_request(
  page_data_state: MatchReportPageDataState,
  organization_logo_url: string,
): Result<MatchReportDownloadRequest> {
  if (page_data_state.status === PRESENCE_STATUS.MISSING)
    return create_failure_result(MATCH_REPORT_MESSAGE.PAGE_DATA_MISSING);
  const page_data = page_data_state.page_data;
  if (
    page_data.home_team_state.status === PRESENCE_STATUS.MISSING ||
    page_data.away_team_state.status === PRESENCE_STATUS.MISSING
  )
    return create_failure_result(MATCH_REPORT_MESSAGE.TEAMS_MISSING);
  return create_success_result({
    fixture: page_data.fixture,
    home_team: page_data.home_team_state.team,
    away_team: page_data.away_team_state.team,
    competition_state: page_data.competition_state,
    sport_state: page_data.sport_state,
    venue_state: page_data.venue_state,
    assigned_officials_data: page_data.assigned_officials_data,
    home_players: page_data.home_players,
    away_players: page_data.away_players,
    organization_logo_url,
  });
}
