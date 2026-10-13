import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_clock_handlers,
  create_state_store,
} from "./liveGameDetailControllerClock.test_support";

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

describe("liveGameDetailControllerClock at full time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the clock stopped while waiting for the full-time whistle", () => {
    vi.useFakeTimers();
    const state_store = create_state_store();
    state_store.set_page_state({
      ...state_store.read_page_state(),
      fixture: {
        id: "fixture-1",
        status: "in_progress",
        current_period: "finished",
      } as never,
      game_clock_seconds: 5400,
    });
    const handlers = create_clock_handlers(state_store);
    derive_live_game_detail_view_state_mock.mockReturnValue({
      is_current_period_playing: false,
    });
    handlers.start_clock();
    vi.advanceTimersByTime(3000);
    expect(state_store.read_page_state()).toEqual(
      expect.objectContaining({
        is_clock_running: false,
        game_clock_seconds: 5400,
        break_elapsed_seconds: 0,
      }),
    );
    handlers.cleanup();
  });
});
