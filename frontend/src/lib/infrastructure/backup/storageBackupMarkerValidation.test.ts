import { describe, expect, it, vi } from "vitest";

import { is_recoverable_session_sync_marker_state } from "./storageBackupMarkerValidation";

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  clerk_session: { subscribe: () => () => {} },
  initialize_clerk: async () => true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({}),
}));

describe("is_recoverable_session_sync_marker_state", () => {
  it.each([
    { status: "missing" },
    { status: "present", marker: { mode: "anonymous" } },
    { status: "present", marker: { mode: "verified", session_id: "s-1" } },
    {
      status: "present",
      marker: { mode: "verified_user", session_id: "s-1", user_id: "u-1" },
    },
  ])("accepts %o", (marker_state) => {
    expect(is_recoverable_session_sync_marker_state(marker_state)).toBe(true);
  });

  it.each([
    "missing",
    { status: "unknown" },
    { status: "present", marker: "anonymous" },
    { status: "present", marker: { mode: "verified", session_id: "" } },
    { status: "present", marker: { mode: "verified_user", session_id: "s-1" } },
    {
      status: "present",
      marker: { mode: "verified_user", session_id: "s-1", user_id: "" },
    },
    { status: "present", marker: { mode: "root" } },
  ])("rejects %o", (marker_state) => {
    expect(is_recoverable_session_sync_marker_state(marker_state)).toBe(false);
  });
});
