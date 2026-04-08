import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  create_managed_game_event_action_handlers_mock,
  create_managed_game_game_action_handlers_mock,
} = vi.hoisted(() => ({
  create_managed_game_event_action_handlers_mock: vi.fn(),
  create_managed_game_game_action_handlers_mock: vi.fn(),
}));

vi.mock("./managedGamePageControllerEventActions", () => ({
  create_managed_game_event_action_handlers:
    create_managed_game_event_action_handlers_mock,
}));

vi.mock("./managedGamePageControllerGameActions", () => ({
  create_managed_game_game_action_handlers:
    create_managed_game_game_action_handlers_mock,
}));

import { create_managed_game_action_handlers } from "./managedGamePageControllerActions";

describe("managedGamePageControllerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges event and game handlers while wiring shared dependencies into both factories", () => {
    const game_handlers = {
      change_period: vi.fn(),
      end_current_period: vi.fn(),
      end_game: vi.fn(),
      handle_start_click: vi.fn(),
      start_game: vi.fn(),
    };
    const event_handlers = {
      cancel_event: vi.fn(),
      open_event_modal: vi.fn(),
      record_event: vi.fn(),
    };
    create_managed_game_game_action_handlers_mock.mockReturnValue(
      game_handlers,
    );
    create_managed_game_event_action_handlers_mock.mockReturnValue(
      event_handlers,
    );

    const result = create_managed_game_action_handlers({
      before_start: vi.fn(),
      fixture_use_cases: { start_fixture: vi.fn() },
      get_state: vi.fn(),
      goto: vi.fn(),
      set_state: vi.fn(),
      start_clock: vi.fn(),
      stop_clock: vi.fn(),
    } as never);

    expect(create_managed_game_game_action_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        before_start: expect.any(Function),
        start_clock: expect.any(Function),
        stop_clock: expect.any(Function),
      }),
    );
    expect(create_managed_game_event_action_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        fixture_use_cases: { start_fixture: expect.any(Function) },
        get_state: expect.any(Function),
        set_state: expect.any(Function),
      }),
    );
    expect(result).toEqual({ ...game_handlers, ...event_handlers });
  });
});
