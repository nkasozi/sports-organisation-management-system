import { browser } from "$app/environment";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";

import {
  create_managed_game_clock_context,
  type ManagedGameClockCommand,
  type ManagedGameClockContext,
  start_managed_game_clock,
  stop_managed_game_clock,
  toggle_managed_game_clock,
  update_managed_game_clock_state,
} from "./managedGamePageControllerClockTicking";
import { apply_managed_game_bundle } from "./managedGamePageControllerState";
import {
  begin_managed_game_page_load,
  complete_managed_game_page_load,
  fail_managed_game_page_load,
} from "./managedGamePageStateMachine";

const MISSING_FIXTURE_ID_MESSAGE = "No fixture ID provided";

async function load_managed_game_fixture(
  context: ManagedGameClockContext,
): Promise<void> {
  update_managed_game_clock_state(context, begin_managed_game_page_load);
  const result = await context.command.load_bundle(
    context.command.get_fixture_id(),
  );
  if (!result.success) {
    update_managed_game_clock_state(context, (state) =>
      fail_managed_game_page_load(state, result.error_message),
    );
    return;
  }
  update_managed_game_clock_state(context, (state) =>
    complete_managed_game_page_load(
      apply_managed_game_bundle(state, result.data),
    ),
  );
}

async function initialize_managed_game_clock(
  context: ManagedGameClockContext,
): Promise<void> {
  if (!browser) return;
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    update_managed_game_clock_state(context, (state) =>
      fail_managed_game_page_load(state, auth_result.error_message),
    );
    return;
  }
  if (!context.command.get_fixture_id()) {
    update_managed_game_clock_state(context, (state) =>
      fail_managed_game_page_load(state, MISSING_FIXTURE_ID_MESSAGE),
    );
    return;
  }
  await load_managed_game_fixture(context);
}

export function create_managed_game_clock_handlers(
  command: ManagedGameClockCommand,
): {
  cleanup: () => void;
  initialize: () => Promise<void>;
  start_clock: () => void;
  stop_clock: () => void;
  toggle_clock: () => void;
} {
  const context = create_managed_game_clock_context(command);
  return {
    initialize: () => initialize_managed_game_clock(context),
    cleanup: (): void => stop_managed_game_clock(context),
    start_clock: (): void => start_managed_game_clock(context),
    stop_clock: (): void => stop_managed_game_clock(context),
    toggle_clock: (): void => toggle_managed_game_clock(context),
  };
}
