import type { Result } from "$lib/core/types/Result";
import { get_team_staff_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";
import type { LiveGameDetailPageActionDependencies } from "$lib/presentation/logic/liveGameDetailPageActions";
import type {
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "$lib/presentation/logic/liveGameDetailPageState";
import { build_live_game_detail_report } from "$lib/presentation/logic/liveGameDetailReport";

import { update_live_game_detail_page_state } from "./liveGameDetailControllerStateAccess";
import { show_live_game_detail_toast } from "./liveGameDetailControllerUtils";
import { TOAST_KIND } from "./toastConfig";

type ReportablePageState = LiveGameDetailPageState & {
  fixture: NonNullable<LiveGameDetailPageState["fixture"]>;
  home_team: NonNullable<LiveGameDetailPageState["home_team"]>;
  away_team: NonNullable<LiveGameDetailPageState["away_team"]>;
};

function is_reportable_page_state(
  page_state: LiveGameDetailPageState,
): page_state is ReportablePageState {
  return Boolean(
    page_state.fixture && page_state.home_team && page_state.away_team,
  );
}

type LiveGameDetailReportHandlersCommand = {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_branding_logo_url: () => string;
  get_page_state: () => LiveGameDetailPageState;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
};

const REPORT_DOWNLOADED_TOAST_MESSAGE = "Match report downloaded!";
const REPORT_DOWNLOAD_FAILED_TOAST_MESSAGE =
  "We couldn't download the match report. Please try again.";
const REPORT_DOWNLOAD_FAILED_EVENT = "live_game_match_report_download_failed";

function set_report_downloading(
  command: LiveGameDetailReportHandlersCommand,
  downloading_report: boolean,
): void {
  update_live_game_detail_page_state(command, (current_page_state) => ({
    ...current_page_state,
    downloading_report,
  }));
}

async function download_live_game_detail_report(
  command: LiveGameDetailReportHandlersCommand,
): Promise<boolean> {
  const page_state = command.get_page_state();
  if (!is_reportable_page_state(page_state)) return false;
  set_report_downloading(command, true);
  const report = await build_report_for_page_state(command, page_state);
  const download_result = download_match_report(
    report.report_data,
    report.filename,
  );
  set_report_downloading(command, false);
  return show_report_download_outcome(
    command,
    page_state.fixture.id,
    download_result,
  );
}

function build_report_for_page_state(
  command: LiveGameDetailReportHandlersCommand,
  page_state: ReportablePageState,
): ReturnType<typeof build_live_game_detail_report> {
  return build_live_game_detail_report(
    page_state.fixture,
    page_state.competition,
    page_state.sport,
    page_state.home_team,
    page_state.away_team,
    page_state.venue,
    page_state.home_players,
    page_state.away_players,
    page_state.assigned_officials_data,
    command.get_branding_logo_url(),
    {
      organization_use_cases:
        command.action_dependencies.organization_use_cases,
      team_staff_use_cases: get_team_staff_use_cases(),
    },
  );
}

function show_report_download_outcome(
  command: LiveGameDetailReportHandlersCommand,
  fixture_id: string,
  download_result: Result<string>,
): boolean {
  if (!download_result.success) {
    console.error("[LiveGameDetail] Match report download failed", {
      event: REPORT_DOWNLOAD_FAILED_EVENT,
      fixture_id,
      error: download_result.error,
    });
    show_live_game_detail_toast(
      command.set_toast_state,
      REPORT_DOWNLOAD_FAILED_TOAST_MESSAGE,
      TOAST_KIND.ERROR,
    );
    return false;
  }
  show_live_game_detail_toast(
    command.set_toast_state,
    REPORT_DOWNLOADED_TOAST_MESSAGE,
    TOAST_KIND.SUCCESS,
  );
  return true;
}

export function create_live_game_detail_report_handlers(
  command: LiveGameDetailReportHandlersCommand,
): {
  download_report: () => Promise<boolean>;
} {
  return {
    download_report: () => download_live_game_detail_report(command),
  };
}
