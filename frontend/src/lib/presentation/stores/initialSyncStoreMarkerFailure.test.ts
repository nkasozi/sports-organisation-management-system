import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initial_sync_store } from "./initialSyncStore";
import {
  mock_app_settings_write_failure,
  reset_session_sync_test_state,
  set_signed_in_clerk_session_state,
} from "./sessionSyncMarkerTestSupport";

vi.mock("$lib/adapters/iam/clerkAuthService", async () =>
  (
    await import("./sessionSyncMarkerTestSupport")
  ).create_clerk_auth_service_mock(),
);
vi.mock("$lib/infrastructure/container", async () =>
  (
    await import("./sessionSyncMarkerTestSupport")
  ).create_app_settings_container_mock(),
);

describe("initial_sync_store.complete_sync marker failures", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports success once the verified marker is saved", async () => {
    set_signed_in_clerk_session_state("session-1", "user-1");

    await expect(initial_sync_store.complete_sync()).resolves.toEqual({
      success: true,
      data: true,
    });
  });

  it("surfaces a failure instead of pretending the session was saved", async () => {
    set_signed_in_clerk_session_state("session-1", "user-1");
    mock_app_settings_write_failure.enabled = true;
    initial_sync_store.start_sync();

    const result = await initial_sync_store.complete_sync();

    expect(result.success).toBe(false);
    expect(get(initial_sync_store).sync_complete).toBe(false);
  });
});
