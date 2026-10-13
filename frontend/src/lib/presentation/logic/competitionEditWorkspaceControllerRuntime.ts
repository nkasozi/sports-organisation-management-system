import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";
import type { Team } from "$lib/core/entities/Team";
import type {
  CompetitionEditPointsField,
  CompetitionEditWorkspaceControllerCommand,
  CompetitionEditWorkspaceControllerRuntime,
} from "$lib/presentation/logic/competitionEditWorkspaceControllerCommand";
import {
  handle_competition_edit_format_change,
  handle_competition_edit_organization_change,
  handle_competition_edit_reset_scoring,
  handle_competition_edit_toggle_auto_squad_submission,
  handle_competition_edit_toggle_tie_breaker,
  handle_competition_edit_update_points,
} from "$lib/presentation/logic/competitionEditWorkspaceFormHandlers";
import {
  handle_competition_edit_add_team,
  handle_competition_edit_remove_team,
  handle_competition_edit_submit,
} from "$lib/presentation/logic/competitionEditWorkspaceTeamHandlers";

export function create_competition_edit_workspace_controller_runtime(
  command: CompetitionEditWorkspaceControllerCommand,
): CompetitionEditWorkspaceControllerRuntime {
  return {
    handle_add_team_to_competition: (team: Team): Promise<void> =>
      handle_competition_edit_add_team(command, team),
    handle_format_change: (event: CustomEvent<{ value: string }>): void =>
      handle_competition_edit_format_change(command, event),
    handle_organization_change: (
      event: CustomEvent<{ value: string }>,
    ): Promise<void> =>
      handle_competition_edit_organization_change(command, event),
    handle_remove_team_from_competition: (team: Team): Promise<void> =>
      handle_competition_edit_remove_team(command, team),
    handle_reset_scoring: (): void =>
      handle_competition_edit_reset_scoring(command),
    handle_submit: (): Promise<void> => handle_competition_edit_submit(command),
    handle_toggle_auto_squad_submission: (enabled: boolean): void =>
      handle_competition_edit_toggle_auto_squad_submission(command, enabled),
    handle_toggle_tie_breaker: (
      tie_breaker: TieBreaker,
      enabled: boolean,
    ): void =>
      handle_competition_edit_toggle_tie_breaker(command, tie_breaker, enabled),
    handle_update_points: (
      field: CompetitionEditPointsField,
      raw_value: string,
    ): void => handle_competition_edit_update_points(command, field, raw_value),
  };
}
