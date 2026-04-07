import { browser } from "$app/environment";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import type { ManagedGameLoadResult } from "$lib/presentation/logic/managedGamePageTypes";

import {
  apply_managed_game_bundle,
  type ManagedGamePageState,
  set_managed_game_loading_error,
} from "./managedGamePageControllerState";

export function create_managed_game_clock_handlers(command: {
  get_fixture_id: () => string;
  get_state: () => ManagedGamePageState;
  load_bundle: (fixture_id: string) => Promise<ManagedGameLoadResult>;
  set_state: (state: ManagedGamePageState) => void;
}): {
  cleanup: () => void;
  initialize: () => Promise<void>;
  start_clock: () => void;
  stop_clock: () => void;
  toggle_clock: () => void;
} {
  let clock_interval: ReturnType<typeof setInterval> | null = null;

  const update_state = (
    updater: (state: ManagedGamePageState) => ManagedGamePageState,
  ): ManagedGamePageState => {
    const next_state = updater(command.get_state());
    command.set_state(next_state);
    return next_state;
  };

  const stop_clock = (): void => {
    if (clock_interval) clearInterval(clock_interval);
    clock_interval = null;
    update_state((state) => ({ ...state, is_clock_running: false }));
  };

  const start_clock = (): void => {
    if (clock_interval) return;
    update_state((state) => ({ ...state, is_clock_running: true }));
    clock_interval = setInterval(() => {
      update_state((state) => ({
        ...state,
        game_clock_seconds: state.game_clock_seconds + 1,
      }));
    }, 1000);
  };

  const load_fixture = async (): Promise<void> => {
    update_state((state) => ({
      ...state,
      is_loading: true,
      error_message: "",
    }));
    const result = await command.load_bundle(command.get_fixture_id());
    if (!result.success) {
      update_state((state) =>
        set_managed_game_loading_error(state, result.error_message),
      );
      return;
    }
    update_state((state) => ({
      ...apply_managed_game_bundle(state, result.data),
      is_loading: false,
      error_message: "",
    }));
  };

  return {
    initialize: async (): Promise<void> => {
      if (!browser) return;
      const auth_result = await ensure_auth_profile();
      if (!auth_result.success) {
        update_state((state) =>
          set_managed_game_loading_error(state, auth_result.error_message),
        );
        return;
      }
      if (!command.get_fixture_id()) {
        update_state((state) =>
          set_managed_game_loading_error(state, "No fixture ID provided"),
        );
        return;
      }
      await load_fixture();
    },
    cleanup: (): void => stop_clock(),
    start_clock,
    stop_clock,
    toggle_clock: (): void => {
      if (command.get_state().is_clock_running) {
        stop_clock();
        return;
      }
      start_clock();
    },
  };
}
