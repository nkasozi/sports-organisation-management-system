import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { ensure_auth_profile_mock } = vi.hoisted(() => ({
  ensure_auth_profile_mock: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));

vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

import { create_managed_game_clock_handlers } from "./managedGamePageControllerClock";
import { create_managed_game_page_state } from "./managedGamePageControllerState";

describe("managedGamePageControllerClock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create_state_store() {
    let current_state = create_managed_game_page_state();
    return {
      get_state: () => current_state,
      read_state: () => current_state,
      set_state: (next_state: typeof current_state) => {
        current_state = next_state;
      },
    };
  }

  it("initializes by loading the bundle after auth succeeds and a fixture id is available", async () => {
    const state_store = create_state_store();
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    const load_bundle = vi.fn().mockResolvedValue({
      success: true,
      data: {
        fixture: { id: "fixture-1", status: "in_progress" },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        home_players: [],
        away_players: [],
        game_clock_seconds: 75,
      },
    });
    const handlers = create_managed_game_clock_handlers({
      get_fixture_id: () => "fixture-1",
      get_state: state_store.get_state,
      load_bundle,
      set_state: state_store.set_state,
    });

    await handlers.initialize();

    expect(load_bundle).toHaveBeenCalledWith("fixture-1");
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", status: "in_progress" },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        game_clock_seconds: 75,
        is_loading: false,
      }),
    );
  });

  it("stores an error when authentication fails before loading the fixture bundle", async () => {
    const state_store = create_state_store();
    ensure_auth_profile_mock.mockResolvedValue({
      success: false,
      error_message: "Access denied",
    });
    const load_bundle = vi.fn();
    const handlers = create_managed_game_clock_handlers({
      get_fixture_id: () => "fixture-1",
      get_state: state_store.get_state,
      load_bundle,
      set_state: state_store.set_state,
    });

    await handlers.initialize();

    expect(load_bundle).not.toHaveBeenCalled();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        is_loading: false,
        error_message: "Access denied",
      }),
    );
  });

  it("starts, toggles, and cleans up the running game clock", () => {
    vi.useFakeTimers();
    const state_store = create_state_store();
    state_store.set_state({
      ...state_store.read_state(),
      game_clock_seconds: 10,
    });
    const handlers = create_managed_game_clock_handlers({
      get_fixture_id: () => "fixture-1",
      get_state: state_store.get_state,
      load_bundle: vi.fn(),
      set_state: state_store.set_state,
    });

    handlers.start_clock();
    vi.advanceTimersByTime(3000);
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        is_clock_running: true,
        game_clock_seconds: 13,
      }),
    );

    handlers.toggle_clock();
    vi.advanceTimersByTime(2000);
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({
        is_clock_running: false,
        game_clock_seconds: 13,
      }),
    );

    handlers.start_clock();
    handlers.cleanup();
    expect(state_store.read_state()).toEqual(
      expect.objectContaining({ is_clock_running: false }),
    );
  });
});
