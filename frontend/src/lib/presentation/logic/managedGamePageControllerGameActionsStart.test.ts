import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_managed_game_game_action_handlers } from "./managedGamePageControllerGameActions";
import {
  create_state_store,
  type HandlerCommand,
} from "./managedGamePageControllerGameActions.test_support";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
});
