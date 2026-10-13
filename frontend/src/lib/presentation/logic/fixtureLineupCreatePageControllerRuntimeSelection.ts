import type { FixtureLineupCreatePageControllerRuntimeCommand } from "./fixtureLineupCreatePageControllerRuntimeTypes";
import { build_fixture_lineup_create_team_change_state } from "./fixtureLineupCreatePageControllerUpdates";
import {
  handle_fixture_lineup_create_organization_change,
  handle_fixture_lineup_create_step_change_attempt,
  handle_fixture_lineup_create_team_change,
  reset_fixture_lineup_create_team_state,
  select_all_fixture_lineup_create_players,
  toggle_fixture_lineup_create_player,
} from "./fixtureLineupCreatePageFlow";

type RuntimeCommand = FixtureLineupCreatePageControllerRuntimeCommand;

const PLAYER_LIMIT_WARNING_DURATION_MS = 3000;

export function reset_fixture_lineup_create_interaction_state(
  command: RuntimeCommand,
): void {
  command.set_error_message("");
  command.set_validation_errors({});
  command.set_confirm_lock_understood(false);
  command.set_player_search_text("");
}

function apply_fixture_lineup_create_team_reset(command: RuntimeCommand): void {
  const reset_state = reset_fixture_lineup_create_team_state();
  command.set_form_data({
    ...command.get_form_data(),
    ...reset_state.form_data,
  });
  command.set_selected_team_state(reset_state.selected_team_state);
  command.set_team_players(reset_state.team_players);
  command.set_available_teams(reset_state.available_teams);
}

export async function handle_fixture_lineup_create_runtime_team_change(
  command: RuntimeCommand,
  team_id: string,
): Promise<void> {
  reset_fixture_lineup_create_interaction_state(command);
  const result = await handle_fixture_lineup_create_team_change({
    team_id,
    selected_fixture_state: command.get_selected_fixture_state(),
    current_auth_profile_state: command.get_current_auth_profile_state(),
    max_players: command.get_max_players(),
    dependencies: command.dependencies,
  });
  const next_state = build_fixture_lineup_create_team_change_state(
    result,
    command.get_form_data(),
    team_id,
  );
  command.set_selected_team_state(next_state.selected_team_state);
  command.set_team_players(next_state.team_players);
  command.set_form_data(next_state.form_data);
  command.set_validation_errors(next_state.validation_errors);
  command.set_current_step_index(2);
}

export function handle_fixture_lineup_create_runtime_organization_change(
  command: RuntimeCommand,
  organization_id: string,
): void {
  const next_state = handle_fixture_lineup_create_organization_change({
    organization_id,
    organizations: command.get_organizations(),
  });
  command.set_form_data({
    ...command.get_form_data(),
    ...next_state.form_data,
  });
  command.set_error_message(next_state.error_message);
  command.set_validation_errors(next_state.validation_errors);
  command.set_selected_organization_state(
    next_state.selected_organization_state,
  );
  command.set_selected_fixture_state(next_state.selected_fixture_state);
  apply_fixture_lineup_create_team_reset(command);
  command.set_current_step_index(next_state.current_step_index);
}

export function handle_fixture_lineup_create_runtime_step_change_attempt(
  command: RuntimeCommand,
  from_step_index: number,
  to_step_index: number,
): boolean {
  const result = handle_fixture_lineup_create_step_change_attempt({
    from_step_index,
    to_step_index,
    form_data: command.get_form_data(),
    min_players: command.get_min_players(),
    max_players: command.get_max_players(),
  });
  command.set_validation_errors(result.validation_errors);
  return result.is_allowed;
}

export function toggle_fixture_lineup_create_runtime_player(
  command: RuntimeCommand,
  player_id: string,
): void {
  const result = toggle_fixture_lineup_create_player({
    form_data: command.get_form_data(),
    team_players: command.get_team_players(),
    player_id,
    max_players: command.get_max_players(),
  });
  command.set_form_data({
    ...command.get_form_data(),
    selected_players: result.selected_players,
  });
  command.set_error_message(result.error_message || "");
  if (result.error_message)
    setTimeout(
      () => command.set_error_message(""),
      PLAYER_LIMIT_WARNING_DURATION_MS,
    );
}

export function select_all_fixture_lineup_create_runtime_players(
  command: RuntimeCommand,
): void {
  command.set_form_data({
    ...command.get_form_data(),
    selected_players: select_all_fixture_lineup_create_players({
      team_players: command.get_team_players(),
      max_players: command.get_max_players(),
    }),
  });
}

export function deselect_all_fixture_lineup_create_runtime_players(
  command: RuntimeCommand,
): void {
  command.set_form_data({
    ...command.get_form_data(),
    selected_players: [],
  });
}
