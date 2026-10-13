import type { create_live_game_detail_game_handlers } from "./liveGameDetailControllerGameActions";
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
  typeof create_live_game_detail_game_handlers
>[0];

export type MockActionDependencies = {
  [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
    HandlerCommand["action_dependencies"][Key]
  >;
};

type ToastStoreState =
  | { status: "hidden" }
  | { status: "visible"; toast: LiveGameDetailToastState };

function create_lineup_player(
  id: string,
): LiveGameDetailPageState["home_players"][number] {
  return {
    id,
    first_name: "Ada",
    last_name: "Stone",
    jersey_number: 0,
    position: "",
    is_captain: false,
    is_substitute: false,
  } as LiveGameDetailPageState["home_players"][number];
}

function create_initial_page_state(): LiveGameDetailPageState {
  return {
    ...create_live_game_detail_page_state(),
    fixture: {
      id: "fixture-1",
      status: "scheduled",
    } as LiveGameDetailPageState["fixture"],
    competition: {
      allow_auto_squad_submission: true,
    } as LiveGameDetailPageState["competition"],
    home_team: { name: "Lions" } as LiveGameDetailPageState["home_team"],
    away_team: { name: "Tigers" } as LiveGameDetailPageState["away_team"],
    home_players: [create_lineup_player("home-1")],
    away_players: [create_lineup_player("away-1")],
  } as LiveGameDetailPageState;
}

function create_initial_modal_state(): LiveGameDetailModalState {
  return {
    ...create_live_game_detail_modal_state(),
    show_start_modal: true,
    show_end_modal: true,
  } as LiveGameDetailModalState;
}

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
  let page_state = create_initial_page_state();
  let modal_state = create_initial_modal_state();
  let toast_state: ToastStoreState = { status: "hidden" };
  return {
    get_modal_state: () => modal_state,
    get_page_state: () => page_state,
    read_modal_state: () => modal_state,
    read_page_state: () => page_state,
    read_toast_state: () =>
      toast_state.status === "visible" ? toast_state.toast : void 0,
    set_modal_state: (next_state: LiveGameDetailModalState) => {
      modal_state = next_state;
    },
    set_page_state: (next_state: LiveGameDetailPageState) => {
      page_state = next_state;
    },
    set_toast_state: (next_state: LiveGameDetailToastState) => {
      toast_state = { status: "visible", toast: next_state };
    },
  };
}
