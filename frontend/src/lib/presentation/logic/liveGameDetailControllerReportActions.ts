import { get_team_staff_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";
import type { LiveGameDetailPageActionDependencies } from "$lib/presentation/logic/liveGameDetailPageActions";
import type {
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "$lib/presentation/logic/liveGameDetailPageState";
import { build_live_game_detail_report } from "$lib/presentation/logic/liveGameDetailReport";

import {
  show_live_game_detail_toast,
  update_live_game_detail_state,
} from "./liveGameDetailControllerUtils";

export function create_live_game_detail_report_handlers(command: {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_branding_logo_url: () => string;
  get_page_state: () => LiveGameDetailPageState;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
}): {
  download_report: () => Promise<boolean>;
} {
  const set_page_state = (
    updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
  ): LiveGameDetailPageState =>
    update_live_game_detail_state({
      get_state: command.get_page_state,
      set_state: command.set_page_state,
      updater,
    });

  return {
    download_report: async (): Promise<boolean> => {
      const page_state = command.get_page_state();
      if (!page_state.fixture || !page_state.home_team || !page_state.away_team)
        return false;
      set_page_state((current_page_state) => ({
        ...current_page_state,
        downloading_report: true,
      }));
      const report = await build_live_game_detail_report(
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
      download_match_report(report.report_data, report.filename);
      set_page_state((current_page_state) => ({
        ...current_page_state,
        downloading_report: false,
      }));
      show_live_game_detail_toast(
        command.set_toast_state,
        "Match report downloaded!",
        "success",
      );
      return true;
    },
  };
}
