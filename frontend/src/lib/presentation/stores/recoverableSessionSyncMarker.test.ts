import { describe, expect, it, vi } from "vitest";

import type { ActiveClerkIdentityState } from "./activeClerkIdentity";
import {
  classify_recoverable_session_sync_marker_safety,
  is_recoverable_session_sync_marker_safety_blocking,
  type RecoverableSessionSyncMarkerState,
} from "./recoverableSessionSyncMarker";

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  clerk_session: { subscribe: () => () => {} },
  initialize_clerk: async () => true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({}),
}));

const SIGNED_OUT: ActiveClerkIdentityState = { status: "signed_out" };
const SIGNED_IN: ActiveClerkIdentityState = {
  status: "signed_in",
  session_id: "session-2",
  user_id: "user-1",
};
const USER_UNRESOLVED: ActiveClerkIdentityState = {
  status: "signed_in_user_unresolved",
  session_id: "session-2",
};

const anonymous_marker: RecoverableSessionSyncMarkerState = {
  status: "present",
  marker: { mode: "anonymous" },
};
const missing_marker: RecoverableSessionSyncMarkerState = { status: "missing" };

function verified_user_marker(
  user_id: string,
): RecoverableSessionSyncMarkerState {
  return {
    status: "present",
    marker: { mode: "verified_user", session_id: "session-1", user_id },
  };
}

function legacy_verified_marker(
  session_id: string,
): RecoverableSessionSyncMarkerState {
  return { status: "present", marker: { mode: "verified", session_id } };
}

describe("classify_recoverable_session_sync_marker_safety while signed out", () => {
  it.each([
    [anonymous_marker, "safe_signed_out_anonymous_backup"],
    [verified_user_marker("user-1"), "blocked_signed_out_verified_backup"],
    [legacy_verified_marker("session-1"), "blocked_signed_out_verified_backup"],
    [missing_marker, "blocked_signed_out_unmarked_backup"],
  ] as const)("classifies %o as %s", (marker_state, expected_status) => {
    expect(
      classify_recoverable_session_sync_marker_safety(marker_state, SIGNED_OUT),
    ).toEqual({ status: expected_status });
  });
});

describe("classify_recoverable_session_sync_marker_safety while signed in", () => {
  it("allows a backup made by the same user in an earlier session", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        verified_user_marker("user-1"),
        SIGNED_IN,
      ),
    ).toEqual({
      status: "safe_matching_verified_user",
      session_id: "session-2",
      user_id: "user-1",
    });
  });

  it("blocks a backup made by a different user", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        verified_user_marker("user-9"),
        SIGNED_IN,
      ),
    ).toEqual({ status: "blocked_active_user_mismatch" });
  });

  it("allows a legacy session backup from the current session", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        legacy_verified_marker("session-2"),
        SIGNED_IN,
      ),
    ).toEqual({
      status: "safe_matching_verified_session",
      session_id: "session-2",
    });
  });

  it("blocks a legacy session backup from another session", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        legacy_verified_marker("session-1"),
        SIGNED_IN,
      ),
    ).toEqual({ status: "blocked_legacy_session_mismatch" });
  });

  it.each([anonymous_marker, missing_marker])(
    "blocks an unowned backup %o",
    (marker_state) => {
      expect(
        classify_recoverable_session_sync_marker_safety(
          marker_state,
          SIGNED_IN,
        ),
      ).toEqual({ status: "blocked_active_session_mismatch" });
    },
  );
});

describe("classify_recoverable_session_sync_marker_safety with an unresolved user", () => {
  it("blocks a user-owned backup because ownership cannot be confirmed", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        verified_user_marker("user-1"),
        USER_UNRESOLVED,
      ),
    ).toEqual({ status: "blocked_active_user_unresolved" });
  });

  it("still allows a legacy backup from the current session", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        legacy_verified_marker("session-2"),
        USER_UNRESOLVED,
      ),
    ).toEqual({
      status: "safe_matching_verified_session",
      session_id: "session-2",
    });
  });

  it("blocks a legacy backup from another session", () => {
    expect(
      classify_recoverable_session_sync_marker_safety(
        legacy_verified_marker("session-1"),
        USER_UNRESOLVED,
      ),
    ).toEqual({ status: "blocked_legacy_session_mismatch" });
  });
});

describe("is_recoverable_session_sync_marker_safety_blocking", () => {
  it.each([
    [{ status: "safe_signed_out_anonymous_backup" }, false],
    [{ status: "safe_matching_verified_session", session_id: "s" }, false],
    [
      { status: "safe_matching_verified_user", session_id: "s", user_id: "u" },
      false,
    ],
    [{ status: "blocked_active_session_mismatch" }, true],
    [{ status: "blocked_active_user_mismatch" }, true],
    [{ status: "blocked_active_user_unresolved" }, true],
    [{ status: "blocked_legacy_session_mismatch" }, true],
    [{ status: "blocked_signed_out_verified_backup" }, true],
    [{ status: "blocked_signed_out_unmarked_backup" }, true],
  ] as const)("treats %o as blocking=%s", (safety, expected) => {
    expect(is_recoverable_session_sync_marker_safety_blocking(safety)).toBe(
      expected,
    );
  });
});
