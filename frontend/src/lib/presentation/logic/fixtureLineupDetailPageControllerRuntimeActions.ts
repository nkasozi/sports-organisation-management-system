import { submit_lineup } from "$lib/adapters/persistence/fixtureLineupService";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  save_fixture_lineup_changes,
  submit_fixture_lineup_changes,
} from "./fixtureLineupDetailPageActions";
import type { FixtureLineupDetailPageControllerRuntimeCommand } from "./fixtureLineupDetailPageControllerRuntimeTypes";
import { toggle_fixture_lineup_player_selection } from "./fixtureLineupDetailPageState";

type RuntimeCommand = FixtureLineupDetailPageControllerRuntimeCommand;

export function toggle_fixture_lineup_detail_runtime_player(
  command: RuntimeCommand,
  player_id: string,
): void {
  const lineup_state = command.get_lineup_state();
  if (lineup_state.status === PRESENCE_STATUS.MISSING) return;
  command.set_lineup_state({
    status: "present",
    lineup: toggle_fixture_lineup_player_selection(
      lineup_state.lineup,
      command.get_team_players(),
      player_id,
    ),
  });
}

export async function save_fixture_lineup_detail_runtime_changes(
  command: RuntimeCommand,
): Promise<void> {
  const lineup_state = command.get_lineup_state();
  if (lineup_state.status === PRESENCE_STATUS.MISSING) return;
  command.set_saving(true);
  command.set_error_message("");
  const result = await save_fixture_lineup_changes(
    command.lineup_id,
    lineup_state.lineup,
    command.use_cases.fixture_lineup_use_cases.update,
    command.update_failed_message,
  );
  command.set_saving(false);
  if (!result.success) {
    command.set_error_message(result.error_message);
    return;
  }
  await command.goto(command.lineup_list_path);
}

export async function submit_fixture_lineup_detail_runtime_lineup(
  command: RuntimeCommand,
): Promise<void> {
  if (
    command.get_lineup_state().status === PRESENCE_STATUS.MISSING ||
    !confirm(command.submit_confirmation)
  )
    return;
  command.set_saving(true);
  const result = await submit_fixture_lineup_changes(
    command.lineup_id,
    submit_lineup,
    command.submit_failed_message,
  );
  command.set_saving(false);
  if (!result.success) {
    command.set_error_message(result.error_message);
    return;
  }
  await command.goto(command.lineup_list_path);
}
