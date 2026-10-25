import { announce_saved_record } from "$lib/presentation/stores/conceptSavedNotice";

import { submit_fixture_lineup_create_form } from "./fixtureLineupCreateData";
import { FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY } from "./fixtureLineupCreateDataTypes";
import { FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND } from "./fixtureLineupCreateInitializationKind";
import { initialize_fixture_lineup_create_page } from "./fixtureLineupCreatePageControllerInitialization";
import {
  handle_fixture_lineup_create_runtime_team_change,
  reset_fixture_lineup_create_interaction_state,
} from "./fixtureLineupCreatePageControllerRuntimeSelection";
import type { FixtureLineupCreatePageControllerRuntimeCommand } from "./fixtureLineupCreatePageControllerRuntimeTypes";
import {
  build_fixture_lineup_create_fixture_change_state,
  build_fixture_lineup_create_reference_state,
  get_fixture_lineup_create_validation_field,
} from "./fixtureLineupCreatePageControllerUpdates";
import { handle_fixture_lineup_create_fixture_change } from "./fixtureLineupCreatePageFlow";

const LINEUP_ENTITY_TYPE = "FixtureLineup";

type RuntimeCommand = FixtureLineupCreatePageControllerRuntimeCommand;
type FixtureChangeState = ReturnType<
  typeof build_fixture_lineup_create_fixture_change_state
>;
type SubmitFailure = Extract<
  Awaited<ReturnType<typeof submit_fixture_lineup_create_form>>,
  { success: false }
>;

const AUTO_SELECTED_TEAM_STEP_INDEX = 3;

function apply_fixture_lineup_create_reference_data(
  command: RuntimeCommand,
  reference_data: Parameters<
    typeof build_fixture_lineup_create_reference_state
  >[0],
): void {
  const reference_state =
    build_fixture_lineup_create_reference_state(reference_data);
  command.set_fixtures(reference_state.fixtures);
  command.set_all_teams(reference_state.all_teams);
  command.set_all_competitions(reference_state.all_competitions);
  command.set_organizations(reference_state.organizations);
  command.set_selected_organization_state(
    reference_state.selected_organization_state,
  );
  command.set_error_message(reference_state.error_message);
}

export async function initialize_fixture_lineup_create_runtime_page(
  command: RuntimeCommand,
): Promise<void> {
  const initialization_result = await initialize_fixture_lineup_create_page({
    is_browser: command.is_browser,
    current_auth_profile_state: command.get_current_auth_profile_state(),
    form_organization_id: command.get_form_data().organization_id,
    organization_is_restricted: command.get_organization_is_restricted(),
    dependencies: command.dependencies,
  });
  switch (initialization_result.kind) {
    case FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND.SKIP:
      return;
    case FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND.AUTH_FAILED:
      command.set_error_message(initialization_result.error_message);
      command.set_loading(false);
      return;
    case FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND.REDIRECT:
      await command.goto(initialization_result.redirect_to);
      return;
    case FIXTURE_LINEUP_CREATE_INITIALIZATION_KIND.LOADED:
      apply_fixture_lineup_create_reference_data(
        command,
        initialization_result.reference_data,
      );
      command.set_loading(false);
      command.set_current_step_index(initialization_result.current_step_index);
  }
}

function apply_fixture_lineup_create_fixture_change_state(
  command: RuntimeCommand,
  next_state: FixtureChangeState,
): void {
  command.set_error_message(next_state.error_message);
  command.set_form_data(next_state.form_data);
  command.set_selected_fixture_state(next_state.selected_fixture_state);
  command.set_selected_organization_state(
    next_state.selected_organization_state,
  );
  command.set_min_players(next_state.min_players);
  command.set_max_players(next_state.max_players);
  command.set_starters_count(next_state.starters_count);
  command.set_available_teams(next_state.available_teams);
  command.set_fixture_team_label_by_team_id(
    next_state.fixture_team_label_by_team_id,
  );
  command.set_teams_with_existing_lineups(
    next_state.teams_with_existing_lineups,
  );
  command.set_selected_team_state(next_state.selected_team_state);
  command.set_team_players(next_state.team_players);
  command.set_fixtures_with_complete_lineups(
    next_state.fixtures_with_complete_lineups,
  );
}

export async function handle_fixture_lineup_create_runtime_fixture_change(
  command: RuntimeCommand,
  fixture_id: string,
): Promise<void> {
  reset_fixture_lineup_create_interaction_state(command);
  const result = await handle_fixture_lineup_create_fixture_change({
    fixture_id,
    current_auth_profile_state: command.get_current_auth_profile_state(),
    organizations: command.get_organizations(),
    dependencies: command.dependencies,
    fixtures_with_complete_lineups:
      command.get_fixtures_with_complete_lineups(),
    team_players_count: command.get_team_players().length,
  });
  apply_fixture_lineup_create_fixture_change_state(
    command,
    build_fixture_lineup_create_fixture_change_state(
      result,
      command.get_form_data(),
    ),
  );
  if (!result.auto_selected_team_id) {
    command.set_current_step_index(result.current_step_index);
    return;
  }
  await handle_fixture_lineup_create_runtime_team_change(
    command,
    result.auto_selected_team_id,
  );
  command.set_current_step_index(AUTO_SELECTED_TEAM_STEP_INDEX);
}

function apply_fixture_lineup_create_submit_failure(
  command: RuntimeCommand,
  result: SubmitFailure,
): void {
  command.set_current_step_index(result.step_index);
  switch (result.failure_display) {
    case FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY.PAGE_ERROR:
      command.set_error_message(result.error_message);
      return;
    case FIXTURE_LINEUP_SUBMIT_FAILURE_DISPLAY.FIELD_VALIDATION:
      command.set_validation_errors({
        [get_fixture_lineup_create_validation_field(result.step_index)]:
          result.error_message,
      });
      return;
  }
}

export async function submit_fixture_lineup_create_runtime_locked_lineup(
  command: RuntimeCommand,
): Promise<void> {
  command.set_saving(true);
  command.set_validation_errors({});
  command.set_error_message("");
  const result = await submit_fixture_lineup_create_form(
    command.get_form_data(),
    command.get_selected_organization_state(),
    command.get_selected_fixture_state(),
    command.get_selected_team_state(),
    command.get_min_players(),
    command.get_max_players(),
    command.get_confirm_lock_understood(),
    command.dependencies,
  );
  command.set_saving(false);
  if (!result.success) {
    apply_fixture_lineup_create_submit_failure(command, result);
    return;
  }
  const lineup_path = `/fixture-lineups/${result.lineup_id}`;
  announce_saved_record(LINEUP_ENTITY_TYPE, "", lineup_path);
  await command.goto(lineup_path);
}
