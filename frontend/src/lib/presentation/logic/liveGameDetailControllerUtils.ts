import type { LiveGameDetailToastState } from "$lib/presentation/logic/liveGameDetailPageState";

export function update_live_game_detail_state<StateType>(command: {
  get_state: () => StateType;
  set_state: (state: StateType) => void;
  updater: (state: StateType) => StateType;
}): StateType {
  const next_state = command.updater(command.get_state());
  command.set_state(next_state);
  return next_state;
}

export function show_live_game_detail_toast(
  set_toast_state: (state: LiveGameDetailToastState) => void,
  message: string,
  type: LiveGameDetailToastState["type"],
): void {
  set_toast_state({ is_visible: true, message, type });
}
