import type {
  CompetitionFormat,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import { load_competition_edit_sport } from "$lib/presentation/logic/competitionEditPageData";
import {
  reset_competition_scoring_overrides,
  toggle_competition_tie_breaker,
  update_competition_points_override,
} from "$lib/presentation/logic/competitionEditPageState";
import type {
  CompetitionEditPointsField,
  CompetitionEditWorkspaceControllerCommand,
} from "$lib/presentation/logic/competitionEditWorkspaceControllerCommand";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

const DEFAULT_COMPETITION_EDIT_TIE_BREAKERS = [
  "goal_difference",
  "goals_scored",
];

export function handle_competition_edit_format_change(
  command: CompetitionEditWorkspaceControllerCommand,
  event: CustomEvent<{ value: string }>,
): void {
  command.set_form_data({
    ...command.get_form_data(),
    competition_format_id: event.detail.value,
  });
  const selected_format = command
    .get_competition_formats()
    .find(
      (competition_format: CompetitionFormat) =>
        competition_format.id === event.detail.value,
    );

  command.set_selected_format_state(
    selected_format
      ? { status: "present", competition_format: selected_format }
      : { status: "missing" },
  );
}

export async function handle_competition_edit_organization_change(
  command: CompetitionEditWorkspaceControllerCommand,
  event: CustomEvent<{ value: string }>,
): Promise<void> {
  command.set_form_data({
    ...command.get_form_data(),
    organization_id: event.detail.value,
    rule_overrides: {},
  });
  const selected_sport_result = await load_competition_edit_sport(
    command.get_organizations(),
    event.detail.value,
  );

  command.set_selected_sport_state(
    selected_sport_result.success
      ? { status: "present", sport: selected_sport_result.data }
      : { status: "missing" },
  );
}

export function handle_competition_edit_reset_scoring(
  command: CompetitionEditWorkspaceControllerCommand,
): void {
  command.set_form_data(
    reset_competition_scoring_overrides(command.get_form_data()),
  );
  command.set_is_customizing_scoring(false);
}

export function handle_competition_edit_toggle_auto_squad_submission(
  command: CompetitionEditWorkspaceControllerCommand,
  enabled: boolean,
): void {
  command.set_form_data({
    ...command.get_form_data(),
    allow_auto_squad_submission: enabled,
    lineup_submission_deadline_hours: enabled
      ? command.get_form_data().lineup_submission_deadline_hours
      : 0,
  });
}

export function handle_competition_edit_toggle_tie_breaker(
  command: CompetitionEditWorkspaceControllerCommand,
  tie_breaker: TieBreaker,
  enabled: boolean,
): void {
  const selected_format_state = command.get_selected_format_state();
  const format_default_tie_breakers = (
    selected_format_state.status === PRESENCE_STATUS.PRESENT
      ? selected_format_state.competition_format.tie_breakers
      : DEFAULT_COMPETITION_EDIT_TIE_BREAKERS
  ) as TieBreaker[];
  command.set_form_data(
    toggle_competition_tie_breaker(
      command.get_form_data(),
      tie_breaker,
      enabled,
      format_default_tie_breakers,
    ),
  );
}

export function handle_competition_edit_update_points(
  command: CompetitionEditWorkspaceControllerCommand,
  field: CompetitionEditPointsField,
  raw_value: string,
): void {
  command.set_form_data(
    update_competition_points_override(
      command.get_form_data(),
      field,
      raw_value,
    ),
  );
}
