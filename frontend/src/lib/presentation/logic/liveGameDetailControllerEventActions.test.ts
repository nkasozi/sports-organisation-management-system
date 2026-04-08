import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  record_live_game_detail_page_event_action_mock,
  update_live_game_detail_player_time_on_action_mock,
} = vi.hoisted(() => ({
  record_live_game_detail_page_event_action_mock: vi.fn(),
  update_live_game_detail_player_time_on_action_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailPageActions", () => ({
  record_live_game_detail_page_event_action:
    record_live_game_detail_page_event_action_mock,
  update_live_game_detail_player_time_on_action:
    update_live_game_detail_player_time_on_action_mock,
}));

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

describe("liveGameDetailControllerEventActions", () => {
  type HandlerCommand = Parameters<
    typeof create_live_game_detail_event_handlers
  >[0];
  type MockActionDependencies = {
    [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
      HandlerCommand["action_dependencies"][Key]
    >;
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
      jersey_number: null,
      position: null,
      is_captain: false,
      is_substitute: false,
      time_on: "present_at_start",
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function create_state_store() {
    let page_state: LiveGameDetailPageState = {
      ...create_live_game_detail_page_state(),
      fixture: {
        id: "fixture-1",
        status: "in_progress",
      } as LiveGameDetailPageState["fixture"],
      home_lineup_id: "home-lineup",
      away_lineup_id: "away-lineup",
      home_players: [create_lineup_player("home-1", "Ada", "Stone")],
      away_players: [create_lineup_player("away-1", "Bo", "Reed")],
    };
    let event_state: LiveGameDetailEventState =
      create_live_game_detail_event_state();
    let toast_state: LiveGameDetailToastState | null = null;
    return {
      get_event_state: () => event_state,
      get_page_state: () => page_state,
      read_event_state: () => event_state,
      read_page_state: () => page_state,
      read_toast_state: () => toast_state,
      set_event_state: (next_state: typeof event_state) => {
        event_state = next_state;
      },
      set_page_state: (next_state: typeof page_state) => {
        page_state = next_state;
      },
      set_toast_state: (next_state: LiveGameDetailToastState) => {
        toast_state = next_state;
      },
    };
  }

  it("opens the event modal and resolves selected player names from the current team lineup", () => {
    const state_store = create_state_store();
    const action_dependencies = {
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_event_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_event_state: state_store.get_event_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          elapsed_minutes: 25,
          is_game_active: true,
          is_substitution_event: false,
        }) as ReturnType<HandlerCommand["get_view_state"]>,
      set_event_state: state_store.set_event_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
    });

    handlers.open_event_modal(
      {
        id: "goal",
        label: "Goal",
      } as NonNullable<LiveGameDetailEventState["selected_event_type"]>,
      "home",
    );
    handlers.select_event_player("home-1");
    handlers.select_secondary_player("home-1");

    expect(state_store.read_event_state()).toEqual(
      expect.objectContaining({
        show_event_modal: true,
        selected_team_side: "home",
        event_minute: 25,
        selected_player_id: "home-1",
        event_player_name: "Ada Stone",
        secondary_player_id: "home-1",
        secondary_player_name: "Ada Stone",
      }),
    );
  });

  it("updates player time-on values and surfaces a toast when the update fails", async () => {
    const state_store = create_state_store();
    update_live_game_detail_player_time_on_action_mock.mockResolvedValue({
      success: false,
      updated_home_players: [{ id: "home-1", time_on: "55" }],
      updated_away_players: [{ id: "away-1", time_on: "present_at_start" }],
      error_message: "Save failed",
    });
    const action_dependencies = {
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_event_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_event_state: state_store.get_event_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          elapsed_minutes: 25,
          is_game_active: true,
          is_substitution_event: false,
        }) as ReturnType<HandlerCommand["get_view_state"]>,
      set_event_state: state_store.set_event_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
    });

    await expect(
      handlers.update_player_time_on("home", "home-1", "55"),
    ).resolves.toBe(false);
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        home_players: [{ id: "home-1", time_on: "55" }],
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Save failed",
      type: "error",
    });
  });

  it("records an event, resets the modal state, and promotes warning messages to error toasts", async () => {
    const state_store = create_state_store();
    state_store.set_event_state({
      ...state_store.read_event_state(),
      selected_event_type: {
        id: "goal",
        label: "Goal",
      } as LiveGameDetailEventState["selected_event_type"],
      event_minute: 33,
      selected_player_id: "home-1",
      event_player_name: "Ada Stone",
      show_event_modal: true,
    });
    record_live_game_detail_page_event_action_mock.mockResolvedValue({
      success: true,
      fixture: { id: "fixture-1", status: "in_progress" },
      updated_home_players: [{ id: "home-1" }],
      updated_away_players: [{ id: "away-1" }],
      warning_message: "Lineup sync pending",
      toast_message: "Goal recorded!",
    });
    const action_dependencies = {
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_event_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_event_state: state_store.get_event_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          elapsed_minutes: 25,
          is_game_active: true,
          is_substitution_event: false,
        }) as ReturnType<HandlerCommand["get_view_state"]>,
      set_event_state: state_store.set_event_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
    });

    await handlers.record_event();

    expect(state_store.read_event_state()).toEqual(
      create_live_game_detail_event_state(),
    );
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", status: "in_progress" },
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Lineup sync pending",
      type: "error",
    });
  });
});
