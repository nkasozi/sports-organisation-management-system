import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_managed_game_controller_runtime } from "./managedGamePageControllerRuntime";

const {
  create_managed_game_action_handlers_mock,
  create_managed_game_clock_handlers_mock,
} = vi.hoisted(() => ({
  create_managed_game_action_handlers_mock: vi.fn(),
  create_managed_game_clock_handlers_mock: vi.fn(),
}));

vi.mock("./managedGamePageControllerActions", () => ({
  create_managed_game_action_handlers: create_managed_game_action_handlers_mock,
}));

vi.mock("./managedGamePageControllerClock", () => ({
  create_managed_game_clock_handlers: create_managed_game_clock_handlers_mock,
}));

describe("managedGamePageControllerRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combines clock and action handlers and injects clock controls into action setup", () => {
    const clock_handlers = {
      cleanup: vi.fn(),
      initialize: vi.fn(),
      start_clock: vi.fn(),
      stop_clock: vi.fn(),
      toggle_clock: vi.fn(),
    };
    const action_handlers = {
      cancel_event: vi.fn(),
      change_period: vi.fn(),
      end_current_period: vi.fn(),
      end_game: vi.fn(),
      handle_start_click: vi.fn(),
      open_event_modal: vi.fn(),
      record_event: vi.fn(),
      start_game: vi.fn(),
    };
    create_managed_game_clock_handlers_mock.mockReturnValue(clock_handlers);
    create_managed_game_action_handlers_mock.mockReturnValue(action_handlers);

    const result = create_managed_game_controller_runtime({
      before_start: vi.fn(),
      fixture_use_cases: { start_fixture: vi.fn() },
      get_fixture_id: vi.fn(),
      get_state: vi.fn(),
      goto: vi.fn(),
      load_bundle: vi.fn(),
      set_state: vi.fn(),
    } as never);

    expect(create_managed_game_clock_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        get_fixture_id: expect.any(Function),
        load_bundle: expect.any(Function),
      }),
    );
    expect(create_managed_game_action_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        before_start: expect.any(Function),
        start_clock: clock_handlers.start_clock,
        stop_clock: clock_handlers.stop_clock,
      }),
    );
    expect(result).toEqual({ ...clock_handlers, ...action_handlers });
  });
});
