import type { QuickEventButton } from "$lib/core/entities/Fixture";
import type { LiveGameDetailPageActionDependencies } from "$lib/presentation/logic/liveGameDetailPageActions";
import {
  get_live_game_detail_event_player,
  type LiveGameDetailDerivedState,
  type LiveGameDetailEventState,
  type LiveGameDetailPageState,
  type LiveGameDetailToastState,
  open_live_game_detail_event_state,
} from "$lib/presentation/logic/liveGameDetailPageState";

import { TEAM_SIDE } from "./gameEventConstants";
import { update_live_game_detail_state } from "./liveGameDetailControllerUtils";

export type LiveGameDetailEventHandlersCommand = {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_event_state: () => LiveGameDetailEventState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => LiveGameDetailDerivedState;
  set_event_state: (state: LiveGameDetailEventState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
};

function update_live_game_detail_event_state(
  command: LiveGameDetailEventHandlersCommand,
  updater: (state: LiveGameDetailEventState) => LiveGameDetailEventState,
): LiveGameDetailEventState {
  return update_live_game_detail_state({
    get_state: command.get_event_state,
    set_state: command.set_event_state,
    updater,
  });
}

function find_selected_team_player(
  command: LiveGameDetailEventHandlersCommand,
  player_id: string,
): ReturnType<typeof get_live_game_detail_event_player> {
  return get_live_game_detail_event_player({
    players:
      command.get_event_state().selected_team_side === TEAM_SIDE.HOME
        ? command.get_page_state().home_players
        : command.get_page_state().away_players,
    player_id,
  });
}

export function open_live_game_detail_event_modal(
  command: LiveGameDetailEventHandlersCommand,
  event_button: QuickEventButton,
  team_side: "home" | "away",
): void {
  if (!command.get_view_state().is_game_active) return;
  command.set_event_state(
    open_live_game_detail_event_state({
      event_button,
      team_side,
      elapsed_minutes: command.get_view_state().elapsed_minutes,
    }),
  );
}

export function select_live_game_detail_event_player(
  command: LiveGameDetailEventHandlersCommand,
  player_id: string,
): void {
  const selection = find_selected_team_player(command, player_id);
  update_live_game_detail_event_state(command, (event_state) => ({
    ...event_state,
    selected_player_id: selection.player_id,
    event_player_name: selection.player_name,
  }));
}

export function select_live_game_detail_secondary_player(
  command: LiveGameDetailEventHandlersCommand,
  player_id: string,
): void {
  const selection = find_selected_team_player(command, player_id);
  update_live_game_detail_event_state(command, (event_state) => ({
    ...event_state,
    secondary_player_id: selection.player_id,
    secondary_player_name: selection.player_name,
  }));
}
