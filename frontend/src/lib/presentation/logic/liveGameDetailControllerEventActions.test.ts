import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_live_game_detail_event_handlers } from "./liveGameDetailControllerEventActions";
import {
  create_state_store,
  type HandlerCommand,
  type MockActionDependencies,
} from "./liveGameDetailControllerEventActions.test_support";
import type { LiveGameDetailEventState } from "./liveGameDetailPageState";
import { create_live_game_detail_event_state } from "./liveGameDetailPageStateFactories";

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

describe("liveGameDetailControllerEventActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
