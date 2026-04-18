import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_live_game_detail_clock_handlers } from "./liveGameDetailControllerClock";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

const {
  check_entity_authorized_mock,
  derive_live_game_detail_view_state_mock,
  ensure_auth_profile_mock,
  load_live_game_detail_bundle_mock,
  set_denial_mock,
} = vi.hoisted(() => ({
  check_entity_authorized_mock: vi.fn(),
  derive_live_game_detail_view_state_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  load_live_game_detail_bundle_mock: vi.fn(),
  set_denial_mock: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailData", () => ({
  load_live_game_detail_bundle: load_live_game_detail_bundle_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailPageDerivedState", () => ({
  derive_live_game_detail_view_state: derive_live_game_detail_view_state_mock,
}));

vi.mock("$lib/presentation/stores/accessDenial", () => ({
  access_denial_store: { set_denial: set_denial_mock },
}));

describe("liveGameDetailControllerClock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create_state_store() {
    let page_state = create_live_game_detail_page_state();
    return {
      get_page_state: () => page_state,
      read_page_state: () => page_state,
      set_page_state: (next_state: typeof page_state) => {
        page_state = next_state;
      },
    };
  }

  it("stores an auth error when initialization fails before data loading", async () => {
    const state_store = create_state_store();
    ensure_auth_profile_mock.mockResolvedValue({
      success: false,
      error_message: "Access denied",
    });
    const handlers = create_live_game_detail_clock_handlers({
      data_dependencies: {} as never,
      fixture_id: () => "fixture-1",
      get_event_state: vi.fn(),
      get_page_state: state_store.get_page_state,
      goto: vi.fn(),
      raw_token: () => "",
      set_page_state: state_store.set_page_state,
    });

    await handlers.initialize();

    expect(load_live_game_detail_bundle_mock).not.toHaveBeenCalled();
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        error_message: "Access denied",
        is_loading: false,
      }),
    );
  });

  it("records an access denial and redirects when read authorization is denied", async () => {
    const goto = vi.fn().mockImplementation(async () => {});
    const state_store = create_state_store();
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: true,
      data: { is_authorized: false },
    });
    const handlers = create_live_game_detail_clock_handlers({
      data_dependencies: {} as never,
      fixture_id: () => "fixture-1",
      get_event_state: vi.fn(),
      get_page_state: state_store.get_page_state,
      goto,
      raw_token: () => "token-1",
      set_page_state: state_store.set_page_state,
    });

    await handlers.initialize();

    expect(set_denial_mock).toHaveBeenCalledWith(
      "/live-games/fixture-1",
      "You do not have permission to view this live game.",
    );
    expect(goto).toHaveBeenCalledWith("/");
  });

  it("reloads a completed bundle and expands both lineups", async () => {
    const state_store = create_state_store();
    load_live_game_detail_bundle_mock.mockResolvedValue({
      success: true,
      data: {
        fixture: { id: "fixture-1", status: "completed" },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },

        organization_name: "",

        assigned_officials_data: [],
        home_players: [],
        away_players: [],
        home_lineup_id: "home-lineup",
        away_lineup_id: "away-lineup",
        game_clock_seconds: 0,
      },
    });
    const handlers = create_live_game_detail_clock_handlers({
      data_dependencies: {} as never,
      fixture_id: () => "fixture-1",
      get_event_state: vi.fn(),
      get_page_state: state_store.get_page_state,
      goto: vi.fn(),
      raw_token: () => "",
      set_page_state: state_store.set_page_state,
    });

    await expect(handlers.reload_fixture_bundle()).resolves.toEqual({
      id: "fixture-1",
      status: "completed",
    });
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        fixture: { id: "fixture-1", status: "completed" },
        home_lineup_expanded: true,
        away_lineup_expanded: true,
      }),
    );
  });

  it("increments game or break time depending on the derived playing state", () => {
    vi.useFakeTimers();
    const state_store = create_state_store();
    state_store.set_page_state({
      ...state_store.read_page_state(),
      fixture: {
        id: "fixture-1",
        status: "in_progress",
        current_period: "first_half",
      } as never,
      game_clock_seconds: 10,
    });
    const handlers = create_live_game_detail_clock_handlers({
      data_dependencies: {} as never,
      fixture_id: () => "fixture-1",
      get_event_state: vi.fn(),
      get_page_state: state_store.get_page_state,
      goto: vi.fn(),
      raw_token: () => "",
      set_page_state: state_store.set_page_state,
    });

    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: true,
    });
    handlers.start_clock();
    vi.advanceTimersByTime(2000);
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        game_clock_seconds: 12,
        break_elapsed_seconds: 0,
      }),
    );

    handlers.stop_clock();
    state_store.set_page_state({
      ...state_store.read_page_state(),
      fixture: {
        id: "fixture-1",
        status: "in_progress",
        current_period: "half_time",
      } as never,
      break_elapsed_seconds: 0,
    });
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: false,
    });
    handlers.start_clock();
    vi.advanceTimersByTime(2000);
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        game_clock_seconds: 12,
        break_elapsed_seconds: 2,
      }),
    );
    handlers.cleanup();
  });
});
