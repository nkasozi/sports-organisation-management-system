import { type QuickEventButton } from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import { record_managed_game_event } from "$lib/presentation/logic/managedGamePageActions";
import { create_present_managed_game_fixture_state } from "$lib/presentation/logic/managedGamePageTypes";

import {
  close_managed_game_event_modal,
  derive_managed_game_view_state,
  type ManagedGamePageState,
  open_managed_game_event_modal,
  set_managed_game_toast,
} from "./managedGamePageControllerState";

type ManagedGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "record_game_event"
>;

export function create_managed_game_event_action_handlers(command: {
  fixture_use_cases: ManagedGameFixtureUseCases;
  get_state: () => ManagedGamePageState;
  set_state: (state: ManagedGamePageState) => void;
}): {
  cancel_event: () => void;
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
} {
  const update_state = (
    updater: (state: ManagedGamePageState) => ManagedGamePageState,
  ): ManagedGamePageState => {
    const next_state = updater(command.get_state());
    command.set_state(next_state);
    return next_state;
  };

  return {
    open_event_modal: (event_button, team_side): void => {
      const view_state = derive_managed_game_view_state(command.get_state());
      if (!view_state.is_game_active) return;
      update_state((state) =>
        open_managed_game_event_modal(
          state,
          event_button,
          team_side,
          view_state.clock_state.elapsed_minutes,
        ),
      );
    },
    cancel_event: (): void => {
      update_state((state) => close_managed_game_event_modal(state));
    },
    record_event: async (): Promise<void> => {
      const current_state = command.get_state();
      const selected_event_type_state = current_state.selected_event_type;
      const result = await record_managed_game_event({
        fixture: current_state.fixture,
        selected_event_type: selected_event_type_state,
        event_minute: current_state.event_minute,
        selected_team_side: current_state.selected_team_side,
        event_player_name: current_state.event_player_name,
        event_description: current_state.event_description,
        fixture_use_cases: command.fixture_use_cases,
      });
      if (!result.success) {
        update_state((state) =>
          set_managed_game_toast(
            { ...state, is_updating: false },
            `Failed to record event: ${result.error}`,
            "error",
          ),
        );
        return;
      }
      update_state((state) => {
        const next_state = close_managed_game_event_modal({
          ...state,
          is_updating: false,
          fixture: create_present_managed_game_fixture_state(result.data),
        });
        return selected_event_type_state.status === "present"
          ? set_managed_game_toast(
              next_state,
              `${selected_event_type_state.event_type.label} recorded!`,
              "success",
            )
          : next_state;
      });
    },
  };
}
