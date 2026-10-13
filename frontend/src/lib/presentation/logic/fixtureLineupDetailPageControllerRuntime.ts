import {
  save_fixture_lineup_detail_runtime_changes,
  submit_fixture_lineup_detail_runtime_lineup,
  toggle_fixture_lineup_detail_runtime_player,
} from "./fixtureLineupDetailPageControllerRuntimeActions";
import { initialize_fixture_lineup_detail_runtime_page } from "./fixtureLineupDetailPageControllerRuntimeInitialization";
import type {
  FixtureLineupDetailPageControllerRuntime,
  FixtureLineupDetailPageControllerRuntimeCommand,
} from "./fixtureLineupDetailPageControllerRuntimeTypes";

export function create_fixture_lineup_detail_page_controller_runtime(
  command: FixtureLineupDetailPageControllerRuntimeCommand,
): FixtureLineupDetailPageControllerRuntime {
  return {
    initialize_page: (): Promise<boolean> =>
      initialize_fixture_lineup_detail_runtime_page(command),
    handle_toggle_player_selection: (player_id: string): void =>
      toggle_fixture_lineup_detail_runtime_player(command, player_id),
    handle_save: (): Promise<void> =>
      save_fixture_lineup_detail_runtime_changes(command),
    handle_submit: (): Promise<void> =>
      submit_fixture_lineup_detail_runtime_lineup(command),
  };
}
