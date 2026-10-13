import type {
  LiveGameDetailModalState,
  LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import { update_live_game_detail_state } from "./liveGameDetailControllerUtils";

type LiveGameDetailPageStateAccess = {
  get_page_state: () => LiveGameDetailPageState;
  set_page_state: (state: LiveGameDetailPageState) => void;
};

type LiveGameDetailModalStateAccess = {
  get_modal_state: () => LiveGameDetailModalState;
  set_modal_state: (state: LiveGameDetailModalState) => void;
};

export function update_live_game_detail_page_state(
  access: LiveGameDetailPageStateAccess,
  updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
): LiveGameDetailPageState {
  return update_live_game_detail_state({
    get_state: access.get_page_state,
    set_state: access.set_page_state,
    updater,
  });
}

export function update_live_game_detail_modal_state(
  access: LiveGameDetailModalStateAccess,
  updater: (state: LiveGameDetailModalState) => LiveGameDetailModalState,
): LiveGameDetailModalState {
  return update_live_game_detail_state({
    get_state: access.get_modal_state,
    set_state: access.set_modal_state,
    updater,
  });
}

export function set_live_game_detail_updating(
  access: LiveGameDetailPageStateAccess,
  is_updating: boolean,
): LiveGameDetailPageState {
  return update_live_game_detail_page_state(access, (current_page_state) => ({
    ...current_page_state,
    is_updating,
  }));
}
