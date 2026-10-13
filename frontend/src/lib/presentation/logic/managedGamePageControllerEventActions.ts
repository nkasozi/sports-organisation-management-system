import { type QuickEventButton } from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import { record_managed_game_event } from "$lib/presentation/logic/managedGamePageActions";
import { create_present_managed_game_fixture_state } from "$lib/presentation/logic/managedGamePageTypes";

import {
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import { show_managed_game_action_failure } from "./managedGamePageControllerGameOutcomes";
import {
  close_managed_game_event_modal,
  derive_managed_game_view_state,
  type ManagedGamePageState,
  open_managed_game_event_modal,
  set_managed_game_toast,
} from "./managedGamePageControllerState";
import { update_managed_game_page_state } from "./managedGamePageControllerStateAccess";
import { PRESENCE_STATUS } from "./presenceStatus";
import { TOAST_KIND } from "./toastConfig";

type ManagedGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "record_game_event"
>;

type ManagedGameEventHandlersCommand = {
  fixture_use_cases: ManagedGameFixtureUseCases;
  get_state: () => ManagedGamePageState;
  set_state: (state: ManagedGamePageState) => void;
};

type RecordManagedGameEventResult = Awaited<
  ReturnType<typeof record_managed_game_event>
>;

function open_managed_game_event(
  command: ManagedGameEventHandlersCommand,
  event_button: QuickEventButton,
  team_side: "home" | "away",
): void {
  const view_state = derive_managed_game_view_state(command.get_state());
  if (!view_state.is_game_active) return;
  update_managed_game_page_state(command, (state) =>
    open_managed_game_event_modal(
      state,
      event_button,
      team_side,
      view_state.clock_state.elapsed_minutes,
    ),
  );
}

function apply_recorded_managed_game_event(
  command: ManagedGameEventHandlersCommand,
  selected_event_type_state: ManagedGamePageState["selected_event_type"],
  result: RecordManagedGameEventResult,
): void {
  if (!result.success) {
    show_managed_game_action_failure(command, {
      event: GAME_ACTION_EVENT.RECORD_EVENT_FAILED,
      technical_error: result.error,
      user_message: GAME_ACTION_USER_MESSAGE.RECORD_EVENT_FAILED,
    });
    return;
  }
  update_managed_game_page_state(command, (state) => {
    const next_state = close_managed_game_event_modal({
      ...state,
      is_updating: false,
      fixture: create_present_managed_game_fixture_state(result.data),
    });
    return selected_event_type_state.status === PRESENCE_STATUS.PRESENT
      ? set_managed_game_toast(
          next_state,
          `${selected_event_type_state.event_type.label} recorded!`,
          TOAST_KIND.SUCCESS,
        )
      : next_state;
  });
}

async function record_managed_game_page_event(
  command: ManagedGameEventHandlersCommand,
): Promise<void> {
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
  apply_recorded_managed_game_event(command, selected_event_type_state, result);
}

export function create_managed_game_event_action_handlers(
  command: ManagedGameEventHandlersCommand,
): {
  cancel_event: () => void;
  open_event_modal: (
    event_button: QuickEventButton,
    team_side: "home" | "away",
  ) => void;
  record_event: () => Promise<void>;
} {
  return {
    open_event_modal: (event_button, team_side): void =>
      open_managed_game_event(command, event_button, team_side),
    cancel_event: (): void => {
      update_managed_game_page_state(command, (state) =>
        close_managed_game_event_modal(state),
      );
    },
    record_event: () => record_managed_game_page_event(command),
  };
}
