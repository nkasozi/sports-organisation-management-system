import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_missing_managed_game_selected_event_type_state,
  create_present_managed_game_fixture_state,
  create_present_managed_game_selected_event_type_state,
  create_present_managed_game_team_state,
} from "$lib/presentation/logic/managedGamePageTypes";

import { create_managed_game_event_action_handlers } from "./managedGamePageControllerEventActions";
import {
  apply_managed_game_bundle,
  create_managed_game_page_state,
} from "./managedGamePageControllerState";

const { record_managed_game_event_mock } = vi.hoisted(() => ({
  record_managed_game_event_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/managedGamePageActions", () => ({
  record_managed_game_event: record_managed_game_event_mock,
}));

describe("managedGamePageControllerEventActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function create_state_store() {
    let current_state = apply_managed_game_bundle(
      create_managed_game_page_state(),
      {
        fixture: {
          id: "fixture-1",
          status: "in_progress",
          current_period: "first_half",
          game_events: [],
        },
        home_team: create_present_managed_game_team_state({
          name: "Lions",
        } as never),
        away_team: create_present_managed_game_team_state({
          name: "Tigers",
        } as never),
        home_players: [],
        away_players: [],
        game_clock_seconds: 600,
      } as never,
    );
    return {
      get_state: () => current_state,
      read_state: () => current_state,
      set_state: (next_state: typeof current_state) => {
        current_state = next_state;
      },
    };
  }

  it("opens and cancels the event modal using the elapsed game minute", () => {
    const state_store = create_state_store();
    const handlers = create_managed_game_event_action_handlers({
      fixture_use_cases: { record_game_event: vi.fn() } as never,
      get_state: state_store.get_state,
      set_state: state_store.set_state,
    });

    handlers.open_event_modal({ id: "goal", label: "Goal" } as never, "away");
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        show_event_modal: true,
        selected_team_side: "away",
        event_minute: 10,
      }),
    );

    handlers.cancel_event();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        show_event_modal: false,
        selected_event_type:
          create_missing_managed_game_selected_event_type_state(),
        event_player_name: "",
      }),
    );
  });

  it("surfaces an error toast when recording a managed-game event fails", async () => {
    const state_store = create_state_store();
    state_store.set_state({
      ...state_store.read_state(),
      show_event_modal: true,
      selected_event_type:
        create_present_managed_game_selected_event_type_state({
          id: "goal",
          label: "Goal",
        } as never),
      event_minute: 18,
    });
    record_managed_game_event_mock.mockResolvedValue({
      success: false,
      error: "network",
    });
    const handlers = create_managed_game_event_action_handlers({
      fixture_use_cases: { record_game_event: vi.fn() } as never,
      get_state: state_store.get_state,
      set_state: state_store.set_state,
    });

    await handlers.record_event();

    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        toast_visible: true,
        toast_message: "Failed to record event: network",
        toast_type: "error",
      }),
    );
  });

  it("closes the modal and shows a success toast after recording an event", async () => {
    const state_store = create_state_store();
    state_store.set_state({
      ...state_store.read_state(),
      show_event_modal: true,
      selected_event_type:
        create_present_managed_game_selected_event_type_state({
          id: "goal",
          label: "Goal",
        } as never),
      event_minute: 22,
    });
    record_managed_game_event_mock.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        status: "in_progress",
        current_period: "first_half",
        game_events: [],
      },
    });
    const handlers = create_managed_game_event_action_handlers({
      fixture_use_cases: { record_game_event: vi.fn() } as never,
      get_state: state_store.get_state,
      set_state: state_store.set_state,
    });

    await handlers.record_event();

    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        show_event_modal: false,
        toast_visible: true,
        toast_message: "Goal recorded!",
        toast_type: "success",
        fixture: create_present_managed_game_fixture_state({
          id: "fixture-1",
          status: "in_progress",
          current_period: "first_half",
          game_events: [],
        } as never),
      }),
    );
  });
});
