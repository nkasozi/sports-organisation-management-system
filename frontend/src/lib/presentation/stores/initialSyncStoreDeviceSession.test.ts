import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolve_current_device_session } from "./initialSyncStore";
import {
  build_verified_user_session_sync_marker,
  mock_app_settings_store,
  mock_initialize_clerk,
  reset_session_sync_test_state,
  SESSION_SYNC_KEY,
  set_clerk_reachability,
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

describe("resolve_current_device_session", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_user_session_sync_marker("session-1", "user-1");
  });

  it("keeps the verified user working offline when Clerk is unreachable", async () => {
    set_clerk_reachability("unreachable");

    await expect(resolve_current_device_session()).resolves.toEqual({
      status: "offline_verified",
      verified_sync: {
        status: "verified_user",
        session_id: "session-1",
        user_id: "user-1",
      },
    });
  });

  it("reports an ended session only when Clerk answered without a session", async () => {
    await expect(resolve_current_device_session()).resolves.toEqual({
      status: "session_ended",
      verified_sync: {
        status: "verified_user",
        session_id: "session-1",
        user_id: "user-1",
      },
    });
  });

  it("reports a signed-in device when Clerk has a session", async () => {
    set_signed_in_clerk_session_state("session-2", "user-1");

    const device_session = await resolve_current_device_session();

    expect(device_session.status).toBe("signed_in");
  });

  it("reports an anonymous device when no verified data was synced", async () => {
    delete mock_app_settings_store[SESSION_SYNC_KEY];
    set_clerk_reachability("unreachable");

    await expect(resolve_current_device_session()).resolves.toEqual({
      status: "anonymous",
    });
  });

  it("waits for Clerk to initialize only while it is still pending", async () => {
    set_clerk_reachability("pending");

    await resolve_current_device_session();
    expect(mock_initialize_clerk).toHaveBeenCalledTimes(1);

    set_clerk_reachability("unreachable");
    await resolve_current_device_session();
    expect(mock_initialize_clerk).toHaveBeenCalledTimes(1);
  });
});
