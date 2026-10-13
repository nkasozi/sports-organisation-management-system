import { create_present_managed_game_fixture_state } from "$lib/presentation/logic/managedGamePageTypes";

import { create_managed_game_game_action_handlers } from "./managedGamePageControllerGameActions";
import type { ManagedGamePageState } from "./managedGamePageControllerState";
import { create_managed_game_page_state } from "./managedGamePageControllerState";
export type HandlerCommand = Parameters<
  typeof create_managed_game_game_action_handlers
>[0];

type ManagedGameStateStore = {
  get_state: () => ManagedGamePageState;
  read_state: () => ManagedGamePageState;
  set_state: (next_state: ManagedGamePageState) => void;
};

export function create_state_store(): ManagedGameStateStore {
  let current_state = {
    ...create_managed_game_page_state(),
    fixture: create_present_managed_game_fixture_state({
      id: "fixture-1",
      status: "in_progress",
      current_period: "first_half",
      game_events: [],
    } as never),
    game_clock_seconds: 1200,
  } as ManagedGamePageState;
  return {
    get_state: () => current_state,
    read_state: () => current_state,
    set_state: (next_state: ManagedGamePageState) => {
      current_state = next_state;
    },
  };
}
