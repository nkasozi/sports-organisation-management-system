import type {
  CompetitionCreatePageControllerCommand,
  CompetitionCreatePageControllerRuntime,
} from "$lib/presentation/logic/competitionCreatePageControllerCommand";
import {
  handle_competition_create_auto_squad_submission_toggle,
  handle_competition_create_format_change,
  handle_competition_create_organization_change,
  handle_competition_create_submit,
  handle_competition_create_team_toggle,
} from "$lib/presentation/logic/competitionCreatePageControllerHandlers";
import { initialize_competition_create_controller } from "$lib/presentation/logic/competitionCreatePageControllerInitialization";

export function create_competition_create_page_controller_runtime(
  command: CompetitionCreatePageControllerCommand,
): CompetitionCreatePageControllerRuntime {
  return {
    handle_auto_squad_submission_toggle: (enabled: boolean): void =>
      handle_competition_create_auto_squad_submission_toggle(command, enabled),
    handle_format_change: (event: CustomEvent<{ value: string }>): void =>
      handle_competition_create_format_change(command, event),
    handle_organization_change: (
      event: CustomEvent<{ value: string }>,
    ): Promise<void> =>
      handle_competition_create_organization_change(command, event),
    handle_submit: (): Promise<void> =>
      handle_competition_create_submit(command),
    handle_team_toggle: (team_id: string): boolean =>
      handle_competition_create_team_toggle(command, team_id),
    initialize: (): Promise<void> =>
      initialize_competition_create_controller(command),
  };
}
