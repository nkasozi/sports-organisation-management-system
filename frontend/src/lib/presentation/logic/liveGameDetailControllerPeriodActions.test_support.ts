import { create_live_game_detail_period_handlers } from "./liveGameDetailControllerPeriodActions";
import type {
  LiveGameDetailModalState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";
import {
  create_live_game_detail_modal_state,
  create_live_game_detail_page_state,
} from "./liveGameDetailPageStateFactories";

export type HandlerCommand = Parameters<
  typeof create_live_game_detail_period_handlers
>[0];
export type MockActionDependencies = {
  [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
    HandlerCommand["action_dependencies"][Key]
  >;
};

type LiveGameDetailTestStateStore = {
  get_modal_state: () => LiveGameDetailModalState;
  get_page_state: () => LiveGameDetailPageState;
  read_modal_state: () => LiveGameDetailModalState;
  read_page_state: () => LiveGameDetailPageState;
  read_toast_state: () => LiveGameDetailToastState | undefined;
  set_modal_state: (next_state: LiveGameDetailModalState) => void;
  set_page_state: (next_state: LiveGameDetailPageState) => void;
  set_toast_state: (next_state: LiveGameDetailToastState) => void;
};

export function create_state_store(): LiveGameDetailTestStateStore {
  let page_state = {
    ...create_live_game_detail_page_state(),
    fixture: {
      id: "fixture-1",
      current_period: "first_half",
    } as LiveGameDetailPageState["fixture"],
    game_clock_seconds: 2700,
    extra_time_added_seconds: 60,
    extra_minutes_to_add: 3,
  } as LiveGameDetailPageState;
  let modal_state = {
    ...create_live_game_detail_modal_state(),
    show_period_modal: true,
    show_extra_time_modal: true,
  } as LiveGameDetailModalState;
  let toast_state:
    | { status: "hidden" }
    | { status: "visible"; toast: LiveGameDetailToastState } = {
    status: "hidden",
  };
  return {
    get_modal_state: () => modal_state,
    get_page_state: () => page_state,
    read_modal_state: () => modal_state,
    read_page_state: () => page_state,
    read_toast_state: () =>
      toast_state.status === "visible" ? toast_state.toast : void 0,
    set_modal_state: (next_state: typeof modal_state) => {
      modal_state = next_state;
    },
    set_page_state: (next_state: typeof page_state) => {
      page_state = next_state;
    },
    set_toast_state: (next_state: LiveGameDetailToastState) => {
      toast_state = { status: "visible", toast: next_state };
    },
  };
}
