import { describe, expect, it, vi } from "vitest";

import {
  type RecoverableSessionSyncMarkerState,
  resolve_restored_session_sync_marker_state,
} from "./recoverableSessionSyncMarker";

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  clerk_session: { subscribe: () => () => {} },
  initialize_clerk: async () => true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({}),
}));

const backup_marker_state: RecoverableSessionSyncMarkerState = {
  status: "present",
  marker: {
    mode: "verified_user",
    session_id: "session-1",
    user_id: "user-1",
  },
};

describe("resolve_restored_session_sync_marker_state", () => {
  it("rebinds a same-user backup to the current session so the restore is not wiped by a fresh login sync", () => {
    expect(
      resolve_restored_session_sync_marker_state(backup_marker_state, {
        status: "safe_matching_verified_user",
        session_id: "session-2",
        user_id: "user-1",
      }),
    ).toEqual({
      status: "present",
      marker: {
        mode: "verified_user",
        session_id: "session-2",
        user_id: "user-1",
      },
    });
  });

  it("keeps the backup marker for a legacy backup from the current session", () => {
    const legacy_marker_state: RecoverableSessionSyncMarkerState = {
      status: "present",
      marker: { mode: "verified", session_id: "session-2" },
    };

    expect(
      resolve_restored_session_sync_marker_state(legacy_marker_state, {
        status: "safe_matching_verified_session",
        session_id: "session-2",
      }),
    ).toEqual(legacy_marker_state);
  });

  it("keeps the backup marker for an anonymous backup", () => {
    const anonymous_marker_state: RecoverableSessionSyncMarkerState = {
      status: "present",
      marker: { mode: "anonymous" },
    };

    expect(
      resolve_restored_session_sync_marker_state(anonymous_marker_state, {
        status: "safe_signed_out_anonymous_backup",
      }),
    ).toEqual(anonymous_marker_state);
  });
});
