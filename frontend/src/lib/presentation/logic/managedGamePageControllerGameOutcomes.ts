import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import {
  create_present_managed_game_fixture_state,
  type ManagedGameStartCheck,
} from "$lib/presentation/logic/managedGamePageTypes";

import {
  build_game_action_failure,
  type GameActionEvent,
} from "./gameActionMessages";
import {
  type ManagedGamePageState,
  set_managed_game_toast,
} from "./managedGamePageControllerState";
import { update_managed_game_page_state } from "./managedGamePageControllerStateAccess";
import { PRESENCE_STATUS } from "./presenceStatus";
import { TOAST_KIND } from "./toastConfig";

export type ManagedGameGameFixtureUseCases = Pick<
  FixtureUseCasesPort,
  "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
>;

export type ManagedGameGameHandlersCommand = {
  before_start: (fixture: Fixture) => Promise<ManagedGameStartCheck>;
  fixture_use_cases: ManagedGameGameFixtureUseCases;
  get_state: () => ManagedGamePageState;
  goto: (path: string) => Promise<unknown>;
  set_state: (state: ManagedGamePageState) => void;
  start_clock: () => void;
  stop_clock: () => void;
};

type ManagedGameActionFailure = {
  event: GameActionEvent;
  technical_error: string;
  user_message: string;
};

function resolve_managed_game_fixture_id(state: ManagedGamePageState): string {
  return state.fixture.status === PRESENCE_STATUS.PRESENT
    ? state.fixture.fixture.id
    : "";
}

export function show_managed_game_action_failure(
  command: Pick<ManagedGameGameHandlersCommand, "get_state" | "set_state">,
  failure: ManagedGameActionFailure,
): void {
  const reported_failure = build_game_action_failure({
    ...failure,
    fixture_id: resolve_managed_game_fixture_id(command.get_state()),
  });
  update_managed_game_page_state(command, (state) =>
    set_managed_game_toast(
      { ...state, is_updating: false },
      reported_failure.error_message,
      TOAST_KIND.ERROR,
    ),
  );
}

export function apply_managed_game_action_success(
  command: ManagedGameGameHandlersCommand,
  fixture: Fixture,
  toast: {
    message: string;
    type: ManagedGamePageState["toast_type"];
  },
  extra_state: Partial<ManagedGamePageState>,
): void {
  update_managed_game_page_state(command, (state) =>
    set_managed_game_toast(
      {
        ...state,
        is_updating: false,
        fixture: create_present_managed_game_fixture_state(fixture),
        ...extra_state,
      },
      toast.message,
      toast.type,
    ),
  );
}
