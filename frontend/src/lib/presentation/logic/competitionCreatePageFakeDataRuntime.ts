import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

import { fill_competition_create_fake_data } from "./competitionCreateFakeData";
import { select_fake_friendly_formats } from "./competitionCreateFakeFormats";
import type { CompetitionCreatePageControllerCommand } from "./competitionCreatePageControllerCommand";
import {
  handle_competition_create_format_change,
  handle_competition_create_organization_change,
} from "./competitionCreatePageControllerHandlers";

const SPORT_STATE_PRESENT = "present";

function read_sport_name(
  command: CompetitionCreatePageControllerCommand,
): Option<string> {
  const sport_state = command.get_selected_sport_state();
  return sport_state.status === SPORT_STATE_PRESENT
    ? create_some_option(sport_state.sport.name)
    : create_none_option();
}

function to_options(
  records: readonly { id: string; name: string }[],
): SelectOption[] {
  return records.map((record) => ({ value: record.id, label: record.name }));
}

export function handle_competition_create_fill_fake_data(
  command: CompetitionCreatePageControllerCommand,
): Promise<void> {
  return fill_competition_create_fake_data({
    get_form_data: command.get_form_data,
    set_form_data: command.set_form_data,
    get_organization_options: () => to_options(command.get_organizations()),
    get_competition_format_options: () =>
      to_options(
        select_fake_friendly_formats(command.get_competition_formats()),
      ),
    get_sport_name: () => read_sport_name(command),
    change_organization: (event) =>
      handle_competition_create_organization_change(command, event),
    change_format: (event) =>
      handle_competition_create_format_change(command, event),
  });
}
