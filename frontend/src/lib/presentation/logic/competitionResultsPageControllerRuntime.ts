import type {
  CompetitionResultsPageControllerCommand,
  CompetitionResultsPageControllerRuntime,
} from "./competitionResultsPageControllerCommand";
import {
  handle_competition_results_organization_change,
  initialize_competition_results_controller_page,
  load_competition_results_controller_data,
} from "./competitionResultsPageControllerHandlers";

export function create_competition_results_page_controller_runtime(
  command: CompetitionResultsPageControllerCommand,
): CompetitionResultsPageControllerRuntime {
  return {
    load_competition_data: (): Promise<void> =>
      load_competition_results_controller_data(command),
    handle_organization_change: (): Promise<void> =>
      handle_competition_results_organization_change(command),
    initialize_page: (): Promise<void> =>
      initialize_competition_results_controller_page(command),
  };
}
