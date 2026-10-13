import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_clock_handlers,
  create_state_store,
} from "./liveGameDetailControllerClock.test_support";

const {
  check_entity_authorized_mock,
  ensure_auth_profile_mock,
  load_live_game_detail_bundle_mock,
  set_denial_mock,
} = vi.hoisted(() => ({
  check_entity_authorized_mock: vi.fn(),
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

vi.mock("$lib/presentation/stores/accessDenial", () => ({
  access_denial_store: { set_denial: set_denial_mock },
}));

const VERIFY_FAILED_MESSAGE =
  "We could not verify your access to this live game. Please try again.";

describe("liveGameDetailControllerClock permission checks fail closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("denies access and skips loading when the read authorization check fails", async () => {
    const goto = vi.fn().mockResolvedValue(true);
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: false,
      error: "adapter offline",
    });
    const handlers = create_clock_handlers(create_state_store(), {
      goto,
      raw_token: "token-1",
    });

    await handlers.initialize();

    expect(set_denial_mock).toHaveBeenCalledWith(
      "/live-games/fixture-1",
      VERIFY_FAILED_MESSAGE,
    );
    expect(goto).toHaveBeenCalledWith("/");
    expect(load_live_game_detail_bundle_mock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "live_game_detail_permission_check_failed",
      }),
    );
  });

  it("denies access and skips loading when there is no session token", async () => {
    const goto = vi.fn().mockResolvedValue(true);
    const handlers = create_clock_handlers(create_state_store(), { goto });

    await handlers.initialize();

    expect(check_entity_authorized_mock).not.toHaveBeenCalled();
    expect(set_denial_mock).toHaveBeenCalledWith(
      "/live-games/fixture-1",
      VERIFY_FAILED_MESSAGE,
    );
    expect(goto).toHaveBeenCalledWith("/");
    expect(load_live_game_detail_bundle_mock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "live_game_detail_permission_token_missing",
      }),
    );
  });
});
