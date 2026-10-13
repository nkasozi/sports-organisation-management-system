import type { ManagedGamePageState } from "./managedGamePageControllerState";

type ManagedGamePageStateAccess = {
  get_state: () => ManagedGamePageState;
  set_state: (state: ManagedGamePageState) => void;
};

export function update_managed_game_page_state(
  access: ManagedGamePageStateAccess,
  updater: (state: ManagedGamePageState) => ManagedGamePageState,
): ManagedGamePageState {
  const next_state = updater(access.get_state());
  access.set_state(next_state);
  return next_state;
}
