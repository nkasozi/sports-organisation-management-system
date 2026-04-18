import { beforeEach, describe, expect, it, vi } from "vitest";

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

const {
  confirm_live_game_extra_time_action_mock,
  confirm_live_game_period_action_mock,
} = vi.hoisted(() => ({
  confirm_live_game_extra_time_action_mock: vi.fn(),
  confirm_live_game_period_action_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailPageActions", () => ({
  confirm_live_game_extra_time_action: confirm_live_game_extra_time_action_mock,
  confirm_live_game_period_action: confirm_live_game_period_action_mock,
}));

describe("liveGameDetailControllerPeriodActions", () => {
  type HandlerCommand = Parameters<
    typeof create_live_game_detail_period_handlers
  >[0];
  type MockActionDependencies = {
    [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
      HandlerCommand["action_dependencies"][Key]
    >;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function create_state_store() {
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

  it("confirms a period action, resets timing state, and starts the clock when instructed", async () => {
    const state_store = create_state_store();
    const start_clock = vi.fn();
    const stop_clock = vi.fn();
    confirm_live_game_period_action_mock.mockResolvedValue({
      success: true,
      fixture: { id: "fixture-1", current_period: "half_time" },
      game_clock_seconds: 2700,
      should_start_clock: true,
      toast_message: "First Half ended",
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_period_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          effective_periods: [],
          elapsed_minutes: 45,
          period_button_config: {
            is_end_action: true,
            next_period: "half_time",
          },
          playing_periods: [],
        }) as unknown as ReturnType<HandlerCommand["get_view_state"]>,
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock,
      stop_clock,
    });

    await handlers.confirm_period_action();

    expect(stop_clock).toHaveBeenCalled();
    expect(start_clock).toHaveBeenCalled();
    expect(state_store.read_modal_state()).toEqual(
      expect.objectContaining({ show_period_modal: false }),
    );
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", current_period: "half_time" },
        game_clock_seconds: 2700,
        extra_time_added_seconds: 0,
        break_elapsed_seconds: 0,
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "First Half ended",
      type: "info",
    });
  });

  it("shows an error toast when a period change fails", async () => {
    const state_store = create_state_store();
    confirm_live_game_period_action_mock.mockResolvedValue({
      success: false,
      error_message: "Period update failed",
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_period_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          effective_periods: [],
          elapsed_minutes: 45,
          period_button_config: {
            is_end_action: false,
            next_period: "second_half",
          },
          playing_periods: [],
        }) as unknown as ReturnType<HandlerCommand["get_view_state"]>,
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock: vi.fn(),
      stop_clock: vi.fn(),
    });

    await handlers.confirm_period_action();

    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "Period update failed",
      type: "error",
    });
  });

  it("records extra time, accumulates added seconds, and restarts the clock when paused", async () => {
    const state_store = create_state_store();
    const start_clock = vi.fn();
    confirm_live_game_extra_time_action_mock.mockResolvedValue({
      success: true,
      fixture: { id: "fixture-1", current_period: "first_half" },
      seconds_added: 180,
      toast_message: "3 min added time - First Half",
    });
    const action_dependencies = {
      fixture_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_period_handlers({
      action_dependencies:
        action_dependencies as HandlerCommand["action_dependencies"],
      get_modal_state: state_store.get_modal_state,
      get_page_state: state_store.get_page_state,
      get_view_state: () =>
        ({
          effective_periods: [],
          elapsed_minutes: 45,
        }) as unknown as ReturnType<HandlerCommand["get_view_state"]>,
      set_modal_state: state_store.set_modal_state,
      set_page_state: state_store.set_page_state,
      set_toast_state: state_store.set_toast_state,
      start_clock,
      stop_clock: vi.fn(),
    });

    await handlers.confirm_extra_time();

    expect(start_clock).toHaveBeenCalled();
    expect(state_store.read_modal_state()).toEqual(
      expect.objectContaining({ show_extra_time_modal: false }),
    );
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        extra_time_added_seconds: 240,
        extra_minutes_to_add: 5,
      }),
    );
    expect(state_store.read_toast_state()).toEqual({
      is_visible: true,
      message: "3 min added time - First Half",
      type: "success",
    });
  });
});
