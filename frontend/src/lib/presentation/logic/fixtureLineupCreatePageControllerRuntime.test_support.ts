import { vi } from "vitest";

type ModuleMock = Record<string, unknown>;

export const build_fixture_lineup_create_fixture_change_state_mock = vi.fn();
export const build_fixture_lineup_create_reference_state_mock = vi.fn();
export const build_fixture_lineup_create_team_change_state_mock = vi.fn();
export const get_fixture_lineup_create_validation_field_mock = vi.fn();
export const handle_fixture_lineup_create_fixture_change_mock = vi.fn();
export const handle_fixture_lineup_create_organization_change_mock = vi.fn();
export const handle_fixture_lineup_create_step_change_attempt_mock = vi.fn();
export const handle_fixture_lineup_create_team_change_mock = vi.fn();
export const initialize_fixture_lineup_create_page_mock = vi.fn();
export const reset_fixture_lineup_create_team_state_mock = vi.fn();
export const select_all_fixture_lineup_create_players_mock = vi.fn();
export const submit_fixture_lineup_create_form_mock = vi.fn();
export const toggle_fixture_lineup_create_player_mock = vi.fn();

export function create_fixture_lineup_create_data_module_mock(): ModuleMock {
  return {
    create_fixture_lineup_create_dependencies: vi.fn(() => ({})),
    submit_fixture_lineup_create_form: submit_fixture_lineup_create_form_mock,
  };
}

export function create_controller_initialization_module_mock(): ModuleMock {
  return {
    initialize_fixture_lineup_create_page:
      initialize_fixture_lineup_create_page_mock,
  };
}

export function create_controller_updates_module_mock(): ModuleMock {
  return {
    build_fixture_lineup_create_fixture_change_state:
      build_fixture_lineup_create_fixture_change_state_mock,
    build_fixture_lineup_create_reference_state:
      build_fixture_lineup_create_reference_state_mock,
    build_fixture_lineup_create_team_change_state:
      build_fixture_lineup_create_team_change_state_mock,
    get_fixture_lineup_create_validation_field:
      get_fixture_lineup_create_validation_field_mock,
  };
}

export function create_page_flow_module_mock(): ModuleMock {
  return {
    handle_fixture_lineup_create_fixture_change:
      handle_fixture_lineup_create_fixture_change_mock,
    handle_fixture_lineup_create_organization_change:
      handle_fixture_lineup_create_organization_change_mock,
    handle_fixture_lineup_create_step_change_attempt:
      handle_fixture_lineup_create_step_change_attempt_mock,
    handle_fixture_lineup_create_team_change:
      handle_fixture_lineup_create_team_change_mock,
    reset_fixture_lineup_create_team_state:
      reset_fixture_lineup_create_team_state_mock,
    select_all_fixture_lineup_create_players:
      select_all_fixture_lineup_create_players_mock,
    toggle_fixture_lineup_create_player:
      toggle_fixture_lineup_create_player_mock,
  };
}
