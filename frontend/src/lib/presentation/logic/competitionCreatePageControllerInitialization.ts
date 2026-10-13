import type { CompetitionCreatePageControllerCommand } from "$lib/presentation/logic/competitionCreatePageControllerCommand";
import {
  competition_create_dependencies,
  COMPETITION_CREATE_PAGE_TEXT,
} from "$lib/presentation/logic/competitionCreatePageControllerDependencies";
import {
  is_organization_restricted,
  trigger_organization_side_effects,
} from "$lib/presentation/logic/competitionCreatePageControllerOrganizationEffects";
import {
  type CompetitionCreatePageInitializationResult,
  initialize_competition_create_page,
} from "$lib/presentation/logic/competitionCreatePageFlow";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";

function apply_competition_create_initialization_error(
  command: CompetitionCreatePageControllerCommand,
  error_message: string,
): void {
  command.set_error_message(error_message);
  command.set_is_loading_organizations(false);
  command.set_is_loading_formats(false);
  command.set_is_loading_teams(false);
}

async function apply_competition_create_initialization_result(
  command: CompetitionCreatePageControllerCommand,
  page_result: CompetitionCreatePageInitializationResult,
): Promise<void> {
  command.set_organizations(page_result.organizations);
  command.set_organization_options(page_result.organization_options);
  command.set_is_loading_organizations(false);
  if (!page_result.preselected_organization_id) {
    command.set_is_loading_formats(false);
    return;
  }
  command.set_form_data({
    ...command.get_form_data(),
    organization_id: page_result.preselected_organization_id,
  });
  await trigger_organization_side_effects(
    command,
    page_result.preselected_organization_id,
  );
}

export async function initialize_competition_create_controller(
  command: CompetitionCreatePageControllerCommand,
): Promise<void> {
  if (!command.is_browser) {
    return;
  }
  const page_result = await initialize_competition_create_page({
    current_auth_profile_state: command.get_current_auth_profile_state(),
    dependencies: competition_create_dependencies,
    is_organization_restricted: is_organization_restricted(command),
    raw_token_state: command.get_current_raw_token_state(),
  });
  if (page_result.access_denied) {
    access_denial_store.set_denial(
      COMPETITION_CREATE_PAGE_TEXT.create_path,
      COMPETITION_CREATE_PAGE_TEXT.access_denied,
    );
    await command.goto("/competitions");
    return;
  }
  if (page_result.error_message) {
    apply_competition_create_initialization_error(
      command,
      page_result.error_message,
    );
    return;
  }
  await apply_competition_create_initialization_result(command, page_result);
}
