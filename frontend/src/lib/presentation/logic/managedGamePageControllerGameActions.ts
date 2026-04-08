import {
  type Fixture,
  type GamePeriod,
  get_period_display_name,
} from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import {
  change_managed_game_period,
  end_managed_game,
  end_managed_game_period,
  start_managed_game,
} from "$lib/presentation/logic/managedGamePageActions";
import type { ManagedGameStartCheck } from "$lib/presentation/logic/managedGamePageTypes";

import {
  derive_managed_game_view_state,
  type ManagedGamePageState,
  set_managed_game_toast,
} from "./managedGamePageControllerState";
type ManagedGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
>;

export function create_managed_game_game_action_handlers(command: {
  before_start: (fixture: Fixture | null) => Promise<ManagedGameStartCheck>;
  fixture_use_cases: ManagedGameFixtureUseCases;
  get_state: () => ManagedGamePageState;
  goto: (path: string) => Promise<unknown>;
  set_state: (state: ManagedGamePageState) => void;
  start_clock: () => void;
  stop_clock: () => void;
}): {
  change_period: (new_period: GamePeriod) => Promise<void>;
  end_current_period: () => Promise<void>;
  end_game: () => Promise<void>;
  handle_start_click: () => Promise<void>;
  start_game: () => Promise<void>;
} {
  const update_state = (
    updater: (state: ManagedGamePageState) => ManagedGamePageState,
  ): ManagedGamePageState => {
    const next_state = updater(command.get_state());
    command.set_state(next_state);
    return next_state;
  };
  return {
    handle_start_click: async (): Promise<void> => {
      const start_check = await command.before_start(
        command.get_state().fixture,
      );
      if (!start_check.allowed) {
        const start_message = start_check.message;
        if (start_message) {
          update_state((state) =>
            set_managed_game_toast(
              state,
              start_message,
              start_check.message_type ?? "error",
            ),
          );
        }
        if (start_check.redirect_path) {
          void command.goto(start_check.redirect_path);
        }
        return;
      }
      update_state((state) => ({ ...state, show_start_modal: true }));
    },
    start_game: async (): Promise<void> => {
      update_state((state) => ({
        ...state,
        is_updating: true,
        show_start_modal: false,
      }));
      const result = await start_managed_game({
        fixture: command.get_state().fixture,
        fixture_use_cases: command.fixture_use_cases,
      });
      if (!result.success) {
        update_state((state) =>
          set_managed_game_toast(
            { ...state, is_updating: false },
            `Failed to start game: ${result.error}`,
            "error",
          ),
        );
        return;
      }
      update_state((state) =>
        set_managed_game_toast(
          {
            ...state,
            is_updating: false,
            fixture: result.data,
            game_clock_seconds: 0,
          },
          "Game started! Clock is running.",
          "success",
        ),
      );
      command.start_clock();
    },
    end_game: async (): Promise<void> => {
      command.stop_clock();
      update_state((state) => ({
        ...state,
        is_updating: true,
        show_end_modal: false,
      }));
      const result = await end_managed_game({
        fixture: command.get_state().fixture,
        fixture_use_cases: command.fixture_use_cases,
      });
      if (!result.success) {
        update_state((state) =>
          set_managed_game_toast(
            { ...state, is_updating: false },
            `Failed to end game: ${result.error}`,
            "error",
          ),
        );
        return;
      }
      update_state((state) =>
        set_managed_game_toast(
          { ...state, is_updating: false, fixture: result.data },
          "Game completed!",
          "success",
        ),
      );
    },
    change_period: async (new_period): Promise<void> => {
      const elapsed_minutes = derive_managed_game_view_state(
        command.get_state(),
      ).clock_state.elapsed_minutes;
      const next_minute =
        new_period === "second_half"
          ? 45
          : new_period === "extra_time_first"
            ? 90
            : elapsed_minutes;
      update_state((state) => ({
        ...state,
        is_updating: true,
        game_clock_seconds: next_minute * 60,
      }));
      const result = await change_managed_game_period({
        fixture: command.get_state().fixture,
        new_period,
        minute: next_minute,
        fixture_use_cases: command.fixture_use_cases,
      });
      if (!result.success) {
        update_state((state) =>
          set_managed_game_toast(
            { ...state, is_updating: false },
            `Failed to change period: ${result.error}`,
            "error",
          ),
        );
        return;
      }
      update_state((state) =>
        set_managed_game_toast(
          { ...state, is_updating: false, fixture: result.data },
          `${get_period_display_name(new_period)} started!`,
          "info",
        ),
      );
      command.start_clock();
    },
    end_current_period: async (): Promise<void> => {
      command.stop_clock();
      const elapsed_minutes = derive_managed_game_view_state(
        command.get_state(),
      ).clock_state.elapsed_minutes;
      update_state((state) => ({ ...state, is_updating: true }));
      const result = await end_managed_game_period({
        fixture: command.get_state().fixture,
        minute: elapsed_minutes,
        fixture_use_cases: command.fixture_use_cases,
      });
      if (!result.success) {
        update_state((state) =>
          set_managed_game_toast(
            { ...state, is_updating: false },
            `Failed to end period: ${result.error}`,
            "error",
          ),
        );
        return;
      }
      update_state((state) =>
        set_managed_game_toast(
          { ...state, is_updating: false, fixture: result.data.fixture },
          `${result.data.completed_period_label} ended`,
          "info",
        ),
      );
    },
  };
}
