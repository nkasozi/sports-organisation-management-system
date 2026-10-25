import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

import { fill_competition_create_fake_data } from "./competitionCreateFakeData";
import { select_fake_friendly_formats } from "./competitionCreateFakeFormats";
import { pick_fake_competition_team_ids } from "./competitionCreateFakeTeams";
import type { CompetitionCreatePageControllerCommand } from "./competitionCreatePageControllerCommand";
import { competition_create_dependencies } from "./competitionCreatePageControllerDependencies";
import {
  handle_competition_create_format_change,
  handle_competition_create_organization_change,
} from "./competitionCreatePageControllerHandlers";

const SPORT_STATE_PRESENT = "present";
const FAKE_TEAM_PAGE_SIZE = 200;

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

async function fill_empty_team_selection(
  command: CompetitionCreatePageControllerCommand,
): Promise<boolean> {
  const organization_id = command.get_form_data().organization_id;
  if (command.get_selected_team_ids().size > 0 || !organization_id)
    return false;
  const teams_result =
    await competition_create_dependencies.team_use_cases.list(
      { organization_id },
      { page_number: 1, page_size: FAKE_TEAM_PAGE_SIZE },
    );
  if (!teams_result.success) return false;
  const team_ids = pick_fake_competition_team_ids(
    teams_result.data.items.map((team) => ({
      id: String(team.id),
      gender_id: String(team.gender_id),
    })),
  );
  command.set_selected_team_ids(new Set(team_ids));
  return team_ids.length > 0;
}

export async function handle_competition_create_fill_fake_data(
  command: CompetitionCreatePageControllerCommand,
): Promise<void> {
  await fill_competition_create_fake_data({
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
  await fill_empty_team_selection(command);
}
