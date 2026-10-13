import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clear_pending_clerk_sign_out,
  has_pending_clerk_sign_out,
  mark_pending_clerk_sign_out,
} from "./pendingClerkSignOut";
import {
  mock_app_settings_store,
  reset_session_sync_test_state,
} from "./sessionSyncMarkerTestSupport";

vi.mock("$lib/infrastructure/container", async () =>
  (
    await import("./sessionSyncMarkerTestSupport")
  ).create_app_settings_container_mock(),
);

describe("pending Clerk sign-out marker", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("is absent on a fresh device", async () => {
    await expect(has_pending_clerk_sign_out()).resolves.toBe(false);
  });

  it("remembers that Clerk still has to be signed out until it is cleared", async () => {
    await mark_pending_clerk_sign_out();
    await expect(has_pending_clerk_sign_out()).resolves.toBe(true);

    await clear_pending_clerk_sign_out();
    await expect(has_pending_clerk_sign_out()).resolves.toBe(false);
    expect(Object.keys(mock_app_settings_store)).toEqual([]);
  });
});
