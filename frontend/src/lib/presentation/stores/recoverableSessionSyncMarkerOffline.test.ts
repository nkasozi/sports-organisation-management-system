import { beforeEach, describe, expect, it, vi } from "vitest";

import { evaluate_recoverable_session_sync_marker_state } from "./initialSyncStore";
import {
  build_verified_user_session_sync_marker,
  mock_app_settings_store,
  mock_initialize_clerk,
  reset_session_sync_test_state,
  SESSION_SYNC_KEY,
  set_clerk_reachability,
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

const SAME_USER_BACKUP = {
  status: "present" as const,
  marker: {
    mode: "verified_user" as const,
    session_id: "session-1",
    user_id: "user-1",
  },
};

describe("evaluate_recoverable_session_sync_marker_state while offline", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_user_session_sync_marker("session-1", "user-1");
  });

  it("keeps backing up the verified user's data while Clerk is unreachable", async () => {
    set_clerk_reachability("unreachable");

    const result =
      await evaluate_recoverable_session_sync_marker_state(SAME_USER_BACKUP);

    expect(result).toEqual({
      status: "safe_matching_verified_user",
      session_id: "session-1",
      user_id: "user-1",
    });
    expect(mock_initialize_clerk).not.toHaveBeenCalled();
  });

  it("refuses another user's backup while offline", async () => {
    set_clerk_reachability("unreachable");

    const result = await evaluate_recoverable_session_sync_marker_state({
      status: "present",
      marker: {
        mode: "verified_user",
        session_id: "session-9",
        user_id: "user-9",
      },
    });

    expect(result).toEqual({ status: "blocked_active_user_mismatch" });
  });

  it("blocks verified backups once the server confirms the session ended", async () => {
    set_clerk_reachability("confirmed");

    const result =
      await evaluate_recoverable_session_sync_marker_state(SAME_USER_BACKUP);

    expect(result).toEqual({ status: "blocked_signed_out_verified_backup" });
  });
});
