import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionCreatePageControllerCommand } from "$lib/presentation/logic/competitionCreatePageControllerCommand";
import {
  competition_create_dependencies,
  COMPETITION_CREATE_PAGE_TEXT,
} from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
import { trigger_organization_side_effects } from "$lib/presentation/logic/competitionCreatePageControllerOrganizationEffects";
import {
  get_next_selected_team_ids,
  update_competition_auto_squad_submission,
} from "$lib/presentation/logic/competitionCreatePageState";
import { submit_competition_create_form } from "$lib/presentation/logic/competitionCreatePageSubmit";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { announce_saved_record } from "$lib/presentation/stores/conceptSavedNotice";

const COMPETITION_ENTITY_TYPE = "Competition";
const COMPETITION_LIST_PATH = "/competitions";

export function handle_competition_create_auto_squad_submission_toggle(
  command: CompetitionCreatePageControllerCommand,
  enabled: boolean,
): void {
  command.set_form_data(
    update_competition_auto_squad_submission(command.get_form_data(), enabled),
  );
}

export function handle_competition_create_format_change(
  command: CompetitionCreatePageControllerCommand,
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

export async function handle_competition_create_organization_change(
  command: CompetitionCreatePageControllerCommand,
  event: CustomEvent<{ value: string }>,
): Promise<void> {
  command.set_form_data({
    ...command.get_form_data(),
    organization_id: event.detail.value,
  });
  await trigger_organization_side_effects(command, event.detail.value);
}

function build_invalid_team_count_message(
  command: CompetitionCreatePageControllerCommand,
): string {
  const selected_format_state = command.get_selected_format_state();
  return selected_format_state.status === PRESENCE_STATUS.PRESENT
    ? `Please select between ${selected_format_state.competition_format.min_teams_required} and ${selected_format_state.competition_format.max_teams_allowed} teams`
    : "Please select valid teams for the chosen competition format";
}

export async function handle_competition_create_submit(
  command: CompetitionCreatePageControllerCommand,
): Promise<void> {
  if (!command.get_is_team_count_valid()) {
    command.show_toast(build_invalid_team_count_message(command), "error");
    return;
  }
  command.set_is_saving(true);
  const submit_result = await submit_competition_create_form({
    dependencies: competition_create_dependencies,
    form_data: command.get_form_data(),
  });
  command.set_is_saving(false);
  if (!submit_result.success) {
    command.show_toast(submit_result.error_message, "error");
    return;
  }
  command.show_toast(COMPETITION_CREATE_PAGE_TEXT.created, "success");
  announce_saved_record(
    COMPETITION_ENTITY_TYPE,
    String(command.get_form_data().name ?? ""),
    COMPETITION_LIST_PATH,
  );
  setTimeout(() => {
    void command.goto(COMPETITION_LIST_PATH);
  }, 1500);
}

export function handle_competition_create_team_toggle(
  command: CompetitionCreatePageControllerCommand,
  team_id: string,
): boolean {
  command.set_selected_team_ids(
    get_next_selected_team_ids(command.get_selected_team_ids(), team_id),
  );
  return true;
}
