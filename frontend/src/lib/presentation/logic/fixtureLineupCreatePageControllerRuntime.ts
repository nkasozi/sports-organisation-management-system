import {
  handle_fixture_lineup_create_runtime_fixture_change,
  initialize_fixture_lineup_create_runtime_page,
  submit_fixture_lineup_create_runtime_locked_lineup,
} from "./fixtureLineupCreatePageControllerRuntimeLifecycle";
import {
  deselect_all_fixture_lineup_create_runtime_players,
  handle_fixture_lineup_create_runtime_organization_change,
  handle_fixture_lineup_create_runtime_step_change_attempt,
  handle_fixture_lineup_create_runtime_team_change,
  select_all_fixture_lineup_create_runtime_players,
  toggle_fixture_lineup_create_runtime_player,
} from "./fixtureLineupCreatePageControllerRuntimeSelection";
import type {
  FixtureLineupCreatePageControllerRuntime,
  FixtureLineupCreatePageControllerRuntimeCommand,
} from "./fixtureLineupCreatePageControllerRuntimeTypes";

export function create_fixture_lineup_create_page_controller_runtime(
  command: FixtureLineupCreatePageControllerRuntimeCommand,
): FixtureLineupCreatePageControllerRuntime {
  return {
    initialize_page: (): Promise<void> =>
      initialize_fixture_lineup_create_runtime_page(command),
    handle_organization_change: (organization_id: string): void =>
      handle_fixture_lineup_create_runtime_organization_change(
        command,
        organization_id,
      ),
    handle_fixture_change: (fixture_id: string): Promise<void> =>
      handle_fixture_lineup_create_runtime_fixture_change(command, fixture_id),
    handle_team_change: (team_id: string): Promise<void> =>
      handle_fixture_lineup_create_runtime_team_change(command, team_id),
    handle_step_change_attempt: (
      from_step_index: number,
      to_step_index: number,
    ): boolean =>
      handle_fixture_lineup_create_runtime_step_change_attempt(
        command,
        from_step_index,
        to_step_index,
      ),
    toggle_player_selection: (player_id: string): void =>
      toggle_fixture_lineup_create_runtime_player(command, player_id),
    select_all_players: (): void =>
      select_all_fixture_lineup_create_runtime_players(command),
    deselect_all_players: (): void =>
      deselect_all_fixture_lineup_create_runtime_players(command),
    handle_submit_locked_lineup: (): Promise<void> =>
      submit_fixture_lineup_create_runtime_locked_lineup(command),
  };
}
