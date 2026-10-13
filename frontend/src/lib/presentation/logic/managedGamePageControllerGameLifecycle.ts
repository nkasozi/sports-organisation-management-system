import type { Fixture } from "$lib/core/entities/Fixture";
import {
  end_managed_game,
  start_managed_game,
} from "$lib/presentation/logic/managedGamePageActions";
import type { ManagedGameStartCheck } from "$lib/presentation/logic/managedGamePageTypes";

import {
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import {
  apply_managed_game_action_success,
  type ManagedGameGameHandlersCommand,
  show_managed_game_action_failure,
} from "./managedGamePageControllerGameOutcomes";
import { set_managed_game_toast } from "./managedGamePageControllerState";
import { update_managed_game_page_state } from "./managedGamePageControllerStateAccess";
import {
  close_managed_game_confirmation_modals,
  MANAGED_GAME_MODAL,
  open_managed_game_confirmation_modal,
} from "./managedGamePageStateMachine";
import { PRESENCE_STATUS } from "./presenceStatus";
import { TOAST_KIND } from "./toastConfig";

const NO_FIXTURE_LOADED_MESSAGE = "No fixture loaded";
const GAME_STARTED_MESSAGE = "Game started! Clock is running.";
const GAME_COMPLETED_MESSAGE = "Game completed!";

function apply_blocked_start_check(
  command: ManagedGameGameHandlersCommand,
  start_check: ManagedGameStartCheck,
): void {
  const start_message = start_check.message;
  if (start_message) {
    update_managed_game_page_state(command, (state) =>
      set_managed_game_toast(
        state,
        start_message,
        start_check.message_type ?? TOAST_KIND.ERROR,
      ),
    );
  }
  if (start_check.redirect_path) {
    void command.goto(start_check.redirect_path);
  }
}

async function check_managed_game_can_start(
  command: ManagedGameGameHandlersCommand,
  fixture: Fixture,
): Promise<void> {
  const start_check = await command.before_start(fixture);
  if (!start_check.allowed) {
    apply_blocked_start_check(command, start_check);
    return;
  }
  update_managed_game_page_state(command, (state) =>
    open_managed_game_confirmation_modal(state, MANAGED_GAME_MODAL.START),
  );
}

export async function handle_managed_game_start_click(
  command: ManagedGameGameHandlersCommand,
): Promise<void> {
  const fixture_state = command.get_state().fixture;
  if (fixture_state.status !== PRESENCE_STATUS.PRESENT) {
    update_managed_game_page_state(command, (state) =>
      set_managed_game_toast(
        state,
        NO_FIXTURE_LOADED_MESSAGE,
        TOAST_KIND.ERROR,
      ),
    );
    return;
  }
  await check_managed_game_can_start(command, fixture_state.fixture);
}

export async function start_managed_game_page_game(
  command: ManagedGameGameHandlersCommand,
): Promise<void> {
  update_managed_game_page_state(command, (state) => ({
    ...close_managed_game_confirmation_modals(state),
    is_updating: true,
  }));
  const result = await start_managed_game({
    fixture: command.get_state().fixture,
    fixture_use_cases: command.fixture_use_cases,
  });
  if (!result.success) {
    show_managed_game_action_failure(command, {
      event: GAME_ACTION_EVENT.START_GAME_FAILED,
      technical_error: result.error,
      user_message: GAME_ACTION_USER_MESSAGE.START_GAME_FAILED,
    });
    return;
  }
  apply_managed_game_action_success(
    command,
    result.data,
    { message: GAME_STARTED_MESSAGE, type: TOAST_KIND.SUCCESS },
    { game_clock_seconds: 0 },
  );
  command.start_clock();
}

export async function end_managed_game_page_game(
  command: ManagedGameGameHandlersCommand,
): Promise<void> {
  command.stop_clock();
  update_managed_game_page_state(command, (state) => ({
    ...close_managed_game_confirmation_modals(state),
    is_updating: true,
  }));
  const result = await end_managed_game({
    fixture: command.get_state().fixture,
    fixture_use_cases: command.fixture_use_cases,
  });
  if (!result.success) {
    show_managed_game_action_failure(command, {
      event: GAME_ACTION_EVENT.END_GAME_FAILED,
      technical_error: result.error,
      user_message: GAME_ACTION_USER_MESSAGE.END_GAME_FAILED,
    });
    return;
  }
  apply_managed_game_action_success(
    command,
    result.data,
    { message: GAME_COMPLETED_MESSAGE, type: TOAST_KIND.SUCCESS },
    {},
  );
}
