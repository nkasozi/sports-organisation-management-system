import { beforeEach, describe, expect, it, vi } from "vitest";

import { get_period_display_name } from "$lib/core/entities/Fixture";
import { create_present_managed_game_fixture_state } from "$lib/presentation/logic/managedGamePageTypes";

import { create_managed_game_game_action_handlers } from "./managedGamePageControllerGameActions";
import type { ManagedGamePageState } from "./managedGamePageControllerState";
import { create_managed_game_page_state } from "./managedGamePageControllerState";

const {
  change_managed_game_period_mock,
  end_managed_game_mock,
  end_managed_game_period_mock,
  start_managed_game_mock,
} = vi.hoisted(() => ({
  change_managed_game_period_mock: vi.fn(),
  end_managed_game_mock: vi.fn(),
  end_managed_game_period_mock: vi.fn(),
  start_managed_game_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/managedGamePageActions", () => ({
  change_managed_game_period: change_managed_game_period_mock,
  end_managed_game: end_managed_game_mock,
  end_managed_game_period: end_managed_game_period_mock,
  start_managed_game: start_managed_game_mock,
}));

describe("managedGamePageControllerGameActions", () => {
  type HandlerCommand = Parameters<
    typeof create_managed_game_game_action_handlers
  >[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function create_state_store() {
    let current_state = {
      ...create_managed_game_page_state(),
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
        status: "in_progress",
        current_period: "first_half",
        game_events: [],
      } as never),
      game_clock_seconds: 1200,
    } as ManagedGamePageState;
    return {
      get_state: () => current_state,
      read_state: () => current_state,
      set_state: (next_state: ManagedGamePageState) => {
        current_state = next_state;
      },
    };
  }

  it("blocks start when the preflight check rejects and redirects when requested", async () => {
    const goto = vi.fn().mockResolvedValue({});
    const state_store = create_state_store();
    const handlers = create_managed_game_game_action_handlers({
      before_start: vi.fn().mockResolvedValue({
        allowed: false,
        message: "Missing squads",
        message_type: "error",
        redirect_path: "/fixtures/fixture-1/squads",
      }),
      fixture_use_cases: {} as HandlerCommand["fixture_use_cases"],
      get_state: state_store.get_state,
      goto,
      set_state: state_store.set_state,
      start_clock: vi.fn(),
      stop_clock: vi.fn(),
    });

    await handlers.handle_start_click();

    expect(goto).toHaveBeenCalledWith("/fixtures/fixture-1/squads");
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        toast_message: "Missing squads",
        toast_type: "error",
      }),
    );
  });

  it("starts the game, resets the clock, and shows a success toast", async () => {
    const start_clock = vi.fn();
    const state_store = create_state_store();
    state_store.set_state({
      ...state_store.read_state(),
      show_start_modal: true,
    });
    start_managed_game_mock.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        status: "in_progress",
        current_period: "first_half",
        game_events: [],
      },
    });
    const handlers = create_managed_game_game_action_handlers({
      before_start: vi.fn(),
      fixture_use_cases: {} as HandlerCommand["fixture_use_cases"],
      get_state: state_store.get_state,
      goto: vi.fn(),
      set_state: state_store.set_state,
      start_clock,
      stop_clock: vi.fn(),
    });

    await handlers.start_game();

    expect(start_clock).toHaveBeenCalled();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        game_clock_seconds: 0,
        show_start_modal: false,
        toast_message: "Game started! Clock is running.",
        toast_type: "success",
      }),
    );
  });

  it("changes period, advances the clock, and restarts timing from the new period", async () => {
    const start_clock = vi.fn();
    const state_store = create_state_store();
    change_managed_game_period_mock.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        current_period: "second_half",
        status: "in_progress",
        game_events: [],
      },
    });
    const handlers = create_managed_game_game_action_handlers({
      before_start: vi.fn(),
      fixture_use_cases: {} as HandlerCommand["fixture_use_cases"],
      get_state: state_store.get_state,
      goto: vi.fn(),
      set_state: state_store.set_state,
      start_clock,
      stop_clock: vi.fn(),
    });

    await handlers.change_period("second_half");

    expect(start_clock).toHaveBeenCalled();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        game_clock_seconds: 2700,
        fixture: create_present_managed_game_fixture_state({
          id: "fixture-1",
          current_period: "second_half",
          status: "in_progress",
          game_events: [],
        } as never),
        toast_message: `${get_period_display_name("second_half")} started!`,
      }),
    );
  });

  it("ends the current period and stops the clock before showing the completion toast", async () => {
    const stop_clock = vi.fn();
    const state_store = create_state_store();
    end_managed_game_period_mock.mockResolvedValue({
      success: true,
      data: {
        fixture: {
          id: "fixture-1",
          current_period: "half_time",
          status: "in_progress",
          game_events: [],
        },
        completed_period_label: "First Half",
      },
    });
    const handlers = create_managed_game_game_action_handlers({
      before_start: vi.fn(),
      fixture_use_cases: {} as HandlerCommand["fixture_use_cases"],
      get_state: state_store.get_state,
      goto: vi.fn(),
      set_state: state_store.set_state,
      start_clock: vi.fn(),
      stop_clock,
    });

    await handlers.end_current_period();

    expect(stop_clock).toHaveBeenCalled();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        fixture: create_present_managed_game_fixture_state({
          id: "fixture-1",
          current_period: "half_time",
          status: "in_progress",
          game_events: [],
        } as never),
        toast_message: "First Half ended",
        toast_type: "info",
      }),
    );
  });

  it("ends the game and reports completion after stopping the clock", async () => {
    const stop_clock = vi.fn();
    const state_store = create_state_store();
    end_managed_game_mock.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        status: "completed",
        current_period: "finished",
        game_events: [],
      },
    });
    const handlers = create_managed_game_game_action_handlers({
      before_start: vi.fn(),
      fixture_use_cases: {} as HandlerCommand["fixture_use_cases"],
      get_state: state_store.get_state,
      goto: vi.fn(),
      set_state: state_store.set_state,
      start_clock: vi.fn(),
      stop_clock,
    });

    await handlers.end_game();

    expect(stop_clock).toHaveBeenCalled();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        fixture: create_present_managed_game_fixture_state({
          id: "fixture-1",
          status: "completed",
          current_period: "finished",
          game_events: [],
        } as never),
        toast_message: "Game completed!",
        toast_type: "success",
      }),
    );
  });
});
