import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLOCK_TEST_NOW,
  create_clock_handlers,
  create_state_store,
} from "./liveGameDetailControllerClock.test_support";

const {
  derive_live_game_detail_view_state_mock,
  load_live_game_detail_bundle_mock,
} = vi.hoisted(() => ({
  derive_live_game_detail_view_state_mock: vi.fn(),
  load_live_game_detail_bundle_mock: vi.fn(),
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
  load_live_game_detail_bundle: load_live_game_detail_bundle_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailPageDerivedState", () => ({
  derive_live_game_detail_view_state: derive_live_game_detail_view_state_mock,
}));

const IN_PLAY_FIXTURE = {
  id: "fixture-1",
  status: "in_progress",
  current_period: "first_half",
} as never;

function create_in_play_store(): ReturnType<typeof create_state_store> {
  const state_store = create_state_store();
  state_store.set_page_state({
    ...state_store.read_page_state(),
    fixture: IN_PLAY_FIXTURE,
    game_clock_seconds: 125,
  });
  return state_store;
}

function create_bundle(fixture: object): object {
  return {
    success: true,
    data: {
      fixture,
      organization_name: "",
      assigned_officials_data: [],
      home_players: [],
      away_players: [],
      home_lineup_id: "",
      away_lineup_id: "",
      game_clock_seconds: 125,
    },
  };
}

describe("live game clock saving", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(CLOCK_TEST_NOW);
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves the exact running clock when the clock starts", () => {
    const save_clock_snapshot = vi.fn().mockResolvedValue({ success: true });
    const handlers = create_clock_handlers(create_in_play_store(), {
      save_clock_snapshot,
    });

    handlers.start_clock();

    expect(save_clock_snapshot).toHaveBeenCalledWith("fixture-1", {
      game_clock: {
        status: "running",
        elapsed_seconds: 125,
        started_at: "2024-06-01T10:00:00.000Z",
      },
      added_seconds: 0,
      break_clock: { status: "not_on_break" },
    });
    handlers.cleanup();
  });

  it("saves a stopped clock when the clock is paused", () => {
    const save_clock_snapshot = vi.fn().mockResolvedValue({ success: true });
    const handlers = create_clock_handlers(create_in_play_store(), {
      save_clock_snapshot,
    });
    handlers.start_clock();
    vi.advanceTimersByTime(3000);

    handlers.toggle_clock();

    expect(save_clock_snapshot).toHaveBeenLastCalledWith("fixture-1", {
      game_clock: { status: "stopped", elapsed_seconds: 128 },
      added_seconds: 0,
      break_clock: { status: "not_on_break" },
    });
  });

  it("does not save when the page is left so the clock keeps running", () => {
    const save_clock_snapshot = vi.fn().mockResolvedValue({ success: true });
    const handlers = create_clock_handlers(create_in_play_store(), {
      save_clock_snapshot,
    });
    handlers.start_clock();
    save_clock_snapshot.mockClear();

    handlers.cleanup();

    expect(save_clock_snapshot).not.toHaveBeenCalled();
  });

  it("keeps a paused clock paused after reloading the game", async () => {
    load_live_game_detail_bundle_mock.mockResolvedValue(
      create_bundle({
        ...(IN_PLAY_FIXTURE as object),
        clock_status: "stopped",
        clock_elapsed_seconds: 125,
      }),
    );
    const state_store = create_state_store();
    const handlers = create_clock_handlers(state_store);

    await handlers.load_fixture_or_error();

    expect(state_store.read_page_state().is_clock_running).toBe(false);
  });

  it("resumes a running clock after reloading the game", async () => {
    load_live_game_detail_bundle_mock.mockResolvedValue(
      create_bundle({
        ...(IN_PLAY_FIXTURE as object),
        clock_status: "running",
        clock_elapsed_seconds: 100,
        clock_started_at: "2024-06-01T09:59:35.000Z",
      }),
    );
    const state_store = create_state_store();
    const handlers = create_clock_handlers(state_store);

    await handlers.load_fixture_or_error();

    expect(load_live_game_detail_bundle_mock).toHaveBeenCalledWith(
      "fixture-1",
      expect.anything(),
      new Date("2024-06-01T10:00:00.000Z"),
    );
    expect(state_store.read_page_state().is_clock_running).toBe(true);
    handlers.cleanup();
  });
});
