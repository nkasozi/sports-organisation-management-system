import type { Fixture } from "$lib/core/entities/Fixture";
import type {
  CompetitionResultsWorkspaceControllerCommand,
  CompetitionResultsWorkspaceControllerRuntime,
} from "$lib/presentation/logic/competitionResultsWorkspaceControllerCommand";
import {
  close_competition_results_team_fixtures_panel,
  handle_competition_results_copy_share_link,
  handle_competition_results_download_all_reports,
  handle_competition_results_download_match_report,
  handle_competition_results_team_click,
} from "$lib/presentation/logic/competitionResultsWorkspaceControllerHandlers";

export function create_competition_results_workspace_controller_runtime(
  command: CompetitionResultsWorkspaceControllerCommand,
): CompetitionResultsWorkspaceControllerRuntime {
  return {
    close_team_fixtures_panel: (): void =>
      close_competition_results_team_fixtures_panel(command),
    handle_copy_share_link: (): boolean =>
      handle_competition_results_copy_share_link(command),
    handle_download_all_reports: (): Promise<boolean> =>
      handle_competition_results_download_all_reports(command),
    handle_download_match_report: (
      fixture: Fixture,
      event: MouseEvent,
    ): Promise<boolean> =>
      handle_competition_results_download_match_report(command, fixture, event),
    handle_team_click: (
      event: CustomEvent<{ team_id: string; team_name: string }>,
    ): Promise<void> => handle_competition_results_team_click(command, event),
  };
}
