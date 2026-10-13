import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  evaluate_recoverable_session_sync_marker_state,
  get_recoverable_session_sync_marker_state,
  persist_recoverable_session_sync_marker_state,
} from "./initialSyncStore";
import {
  ANONYMOUS_SESSION_SYNC_MARKER,
  build_legacy_verified_session_sync_marker,
  build_verified_user_session_sync_marker,
  mock_app_settings_store,
  mock_initialize_clerk,
  reset_session_sync_test_state,
  SESSION_SYNC_KEY,
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

describe("get_recoverable_session_sync_marker_state", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
  });

  it.each([
    ["", { status: "missing" }],
    ["true", { status: "missing" }],
    [
      ANONYMOUS_SESSION_SYNC_MARKER,
      { status: "present", marker: { mode: "anonymous" } },
    ],
    [
      build_legacy_verified_session_sync_marker("session-7"),
      {
        status: "present",
        marker: { mode: "verified", session_id: "session-7" },
      },
    ],
    [
      build_verified_user_session_sync_marker("session-7", "user-1"),
      {
        status: "present",
        marker: {
          mode: "verified_user",
          session_id: "session-7",
          user_id: "user-1",
        },
      },
    ],
  ])("reads stored marker %s", async (raw_marker, expected) => {
    mock_app_settings_store[SESSION_SYNC_KEY] = raw_marker;

    expect(await get_recoverable_session_sync_marker_state()).toEqual(expected);
  });

  it("treats a user marker without a user id as missing", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] = JSON.stringify({
      mode: "verified_user",
      session_id: "session-7",
    });

    expect(await get_recoverable_session_sync_marker_state()).toEqual({
      status: "missing",
    });
  });
});

describe("evaluate_recoverable_session_sync_marker_state", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
  });

  it("initializes clerk and allows a same-user backup from an earlier session", async () => {
    set_signed_in_clerk_session_state("session-2", "user-1");

    const result = await evaluate_recoverable_session_sync_marker_state({
      status: "present",
      marker: {
        mode: "verified_user",
        session_id: "session-1",
        user_id: "user-1",
      },
    });

    expect(mock_initialize_clerk).toHaveBeenCalled();
    expect(result).toEqual({
      status: "safe_matching_verified_user",
      session_id: "session-2",
      user_id: "user-1",
    });
  });

  it("blocks a legacy backup from an earlier session", async () => {
    set_signed_in_clerk_session_state("session-2", "user-1");

    const result = await evaluate_recoverable_session_sync_marker_state({
      status: "present",
      marker: { mode: "verified", session_id: "session-1" },
    });

    expect(result).toEqual({ status: "blocked_legacy_session_mismatch" });
  });
});

describe("persist_recoverable_session_sync_marker_state", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
  });

  it("writes a user marker", async () => {
    await persist_recoverable_session_sync_marker_state({
      status: "present",
      marker: {
        mode: "verified_user",
        session_id: "session-8",
        user_id: "user-1",
      },
    });

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      build_verified_user_session_sync_marker("session-8", "user-1"),
    );
  });

  it("writes a legacy marker unchanged", async () => {
    await persist_recoverable_session_sync_marker_state({
      status: "present",
      marker: { mode: "verified", session_id: "session-8" },
    });

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      build_legacy_verified_session_sync_marker("session-8"),
    );
  });

  it("clears the marker when state is missing", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_legacy_verified_session_sync_marker("session-8");

    await persist_recoverable_session_sync_marker_state({ status: "missing" });

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBeUndefined();
  });
});
