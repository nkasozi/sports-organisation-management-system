import { create_live_game_detail_event_handlers } from "./liveGameDetailControllerEventActions";
import type {
  LiveGameDetailEventState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";
import {
  create_live_game_detail_event_state,
  create_live_game_detail_page_state,
} from "./liveGameDetailPageStateFactories";
export type HandlerCommand = Parameters<
  typeof create_live_game_detail_event_handlers
>[0];
export type MockActionDependencies = {
  [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
    HandlerCommand["action_dependencies"][Key]
  >;
};
type LiveGameDetailStateStore = {
  get_event_state: () => LiveGameDetailEventState;
  get_page_state: () => LiveGameDetailPageState;
  read_event_state: () => LiveGameDetailEventState;
  read_page_state: () => LiveGameDetailPageState;
  read_toast_state: () => LiveGameDetailToastState | undefined;
  set_event_state: (next_state: LiveGameDetailEventState) => void;
  set_page_state: (next_state: LiveGameDetailPageState) => void;
  set_toast_state: (next_state: LiveGameDetailToastState) => void;
};

function create_lineup_player(
  id: string,
  first_name: string,
  last_name: string,
): LiveGameDetailPageState["home_players"][number] {
  return {
    id,
    first_name,
    last_name,
    jersey_number: 0,
    position: "",
    is_captain: false,
    is_substitute: false,
    time_on: "present_at_start",
  } as LiveGameDetailPageState["home_players"][number];
}
export function create_state_store(): LiveGameDetailStateStore {
  let page_state = {
    ...create_live_game_detail_page_state(),
    fixture: {
      id: "fixture-1",
      status: "in_progress",
    } as LiveGameDetailPageState["fixture"],
    home_lineup_id: "home-lineup",
    away_lineup_id: "away-lineup",
    home_players: [create_lineup_player("home-1", "Ada", "Stone")],
    away_players: [create_lineup_player("away-1", "Bo", "Reed")],
  } as LiveGameDetailPageState;
  let event_state: LiveGameDetailEventState =
    create_live_game_detail_event_state();
  let toast_state:
    | { status: "hidden" }
    | { status: "visible"; toast: LiveGameDetailToastState } = {
    status: "hidden",
  };
  return {
    get_event_state: () => event_state,
    get_page_state: () => page_state,
    read_event_state: () => event_state,
    read_page_state: () => page_state,
    read_toast_state: () =>
      toast_state.status === "visible" ? toast_state.toast : void 0,
    set_event_state: (next_state: typeof event_state) => {
      event_state = next_state;
    },
    set_page_state: (next_state: typeof page_state) => {
      page_state = next_state;
    },
    set_toast_state: (next_state: LiveGameDetailToastState) => {
      toast_state = { status: "visible", toast: next_state };
    },
  };
}
