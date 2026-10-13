import { match_report_page_dependencies } from "$lib/presentation/logic/matchReportPageDependencies";
import { download_match_report_for_fixture } from "$lib/presentation/logic/matchReportPageDownload";
import { load_match_report_page_data } from "$lib/presentation/logic/matchReportPageLoad";
import type { MatchReportPageDataState } from "$lib/presentation/logic/matchReportPageLoadTypes";
import { build_match_report_download_request } from "$lib/presentation/logic/matchReportPageTransitions";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  MATCH_REPORT_LOG_EVENTS,
  MATCH_REPORT_PAGE_TEXT,
} from "./matchReportPageMessages";
import {
  create_match_report_failed_state,
  MATCH_REPORT_READY_STATE,
  type MatchReportPageStatusState,
} from "./matchReportPageStatus";

export const MATCH_REPORT_DOWNLOAD_OUTCOME = {
  SKIPPED: "skipped",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
} as const;

type MatchReportDownloadOutcome =
  | { status: typeof MATCH_REPORT_DOWNLOAD_OUTCOME.SKIPPED }
  | { status: typeof MATCH_REPORT_DOWNLOAD_OUTCOME.SUCCEEDED; message: string }
  | { status: typeof MATCH_REPORT_DOWNLOAD_OUTCOME.FAILED; message: string };

interface MatchReportLoadOutcome {
  page_status_state: MatchReportPageStatusState;
  page_data_state: MatchReportPageDataState;
}

export async function load_match_report_page(
  fixture_id: string,
  current_data_state: MatchReportPageDataState,
): Promise<MatchReportLoadOutcome> {
  if (!fixture_id) {
    return {
      page_status_state: create_match_report_failed_state(
        MATCH_REPORT_PAGE_TEXT.missing_fixture_id,
      ),
      page_data_state: current_data_state,
    };
  }
  const result = await load_match_report_page_data({
    fixture_id,
    dependencies: match_report_page_dependencies,
  });
  if (!result.success) {
    console.error("[MatchReport] Page load failed", {
      event: MATCH_REPORT_LOG_EVENTS.LOAD_FAILED,
      fixture_id,
      error: result.error,
    });
    return {
      page_status_state: create_match_report_failed_state(
        MATCH_REPORT_PAGE_TEXT.load_failed,
      ),
      page_data_state: current_data_state,
    };
  }
  return {
    page_status_state: MATCH_REPORT_READY_STATE,
    page_data_state: {
      status: PRESENCE_STATUS.PRESENT,
      page_data: result.data,
    },
  };
}

export async function download_match_report_for_page(
  page_data_state: MatchReportPageDataState,
  organization_logo_url: string,
  fixture_id: string,
): Promise<MatchReportDownloadOutcome> {
  const request_result = build_match_report_download_request(
    page_data_state,
    organization_logo_url,
  );
  if (!request_result.success) {
    return { status: MATCH_REPORT_DOWNLOAD_OUTCOME.SKIPPED };
  }
  const result = await download_match_report_for_fixture({
    ...request_result.data,
    dependencies: match_report_page_dependencies,
  });
  if (!result.success) {
    console.error("[MatchReport] Download failed", {
      event: MATCH_REPORT_LOG_EVENTS.DOWNLOAD_FAILED,
      fixture_id,
      error: result.error,
    });
    return {
      status: MATCH_REPORT_DOWNLOAD_OUTCOME.FAILED,
      message: MATCH_REPORT_PAGE_TEXT.download_failed,
    };
  }
  return {
    status: MATCH_REPORT_DOWNLOAD_OUTCOME.SUCCEEDED,
    message: result.data,
  };
}
