import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLOCK_TEST_NOW,
  create_clock_handlers,
  create_state_store,
} from "./liveGameDetailControllerClock.test_support";

const { derive_live_game_detail_view_state_mock } = vi.hoisted(() => ({
  derive_live_game_detail_view_state_mock: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));
vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: vi.fn(),
}));
vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: vi.fn(),
}));
vi.mock("$lib/presentation/stores/accessDenial", () => ({
  access_denial_store: { set_denial: vi.fn() },
}));
vi.mock("$lib/presentation/logic/liveGameDetailData", () => ({
  load_live_game_detail_bundle: vi.fn(),
}));
vi.mock("$lib/presentation/logic/liveGameDetailPageDerivedState", () => ({
  derive_live_game_detail_view_state: derive_live_game_detail_view_state_mock,
}));

const SECONDS_WHILE_SCREEN_LOCKED = 30;

function create_store_in_period(
  current_period: string,
): ReturnType<typeof create_state_store> {
  const state_store = create_state_store();
  state_store.set_page_state({
    ...state_store.read_page_state(),
    fixture: {
      id: "fixture-1",
      status: "in_progress",
      current_period,
    } as never,
    game_clock_seconds: 100,
  });
  return state_store;
}

describe("live game clock follows the wall clock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(CLOCK_TEST_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("catches up on game time when ticks were throttled", () => {
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: true,
    });
    const state_store = create_store_in_period("first_half");
    const handlers = create_clock_handlers(state_store);
    handlers.start_clock();

    vi.setSystemTime(
      CLOCK_TEST_NOW.getTime() + SECONDS_WHILE_SCREEN_LOCKED * 1000,
    );
    vi.advanceTimersByTime(1000);

    expect(state_store.read_page_state().game_clock_seconds).toBe(131);
    handlers.cleanup();
  });

  it("catches up on break time when ticks were throttled", () => {
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: false,
    });
    const state_store = create_store_in_period("half_time");
    const handlers = create_clock_handlers(state_store);
    handlers.start_clock();

    vi.setSystemTime(
      CLOCK_TEST_NOW.getTime() + SECONDS_WHILE_SCREEN_LOCKED * 1000,
    );
    vi.advanceTimersByTime(1000);

    expect(state_store.read_page_state()).toMatchObject({
      game_clock_seconds: 100,
      break_elapsed_seconds: 31,
    });
    handlers.cleanup();
  });

  it("saves the exact wall-clock time when paused after throttled ticks", () => {
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: true,
    });
    const save_clock_snapshot = vi.fn().mockResolvedValue({ success: true });
    const state_store = create_store_in_period("first_half");
    const handlers = create_clock_handlers(state_store, {
      save_clock_snapshot,
    });
    handlers.start_clock();

    vi.setSystemTime(CLOCK_TEST_NOW.getTime() + 45_500);
    handlers.toggle_clock();

    expect(save_clock_snapshot).toHaveBeenLastCalledWith(
      "fixture-1",
      expect.objectContaining({
        game_clock: { status: "stopped", elapsed_seconds: 145 },
      }),
    );
  });

  it("persists a running break with its start time and the added time", () => {
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: false,
    });
    const save_clock_snapshot = vi.fn().mockResolvedValue({ success: true });
    const state_store = create_store_in_period("half_time");
    state_store.set_page_state({
      ...state_store.read_page_state(),
      break_elapsed_seconds: 60,
      extra_time_added_seconds: 120,
    });
    const handlers = create_clock_handlers(state_store, {
      save_clock_snapshot,
    });

    handlers.start_clock();

    expect(save_clock_snapshot).toHaveBeenCalledWith("fixture-1", {
      game_clock: { status: "stopped", elapsed_seconds: 100 },
      added_seconds: 120,
      break_clock: {
        status: "on_break",
        started_at: "2024-06-01T09:59:00.000Z",
      },
    });
    handlers.cleanup();
  });
});
