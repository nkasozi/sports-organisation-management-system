import { beforeEach, describe, expect, it, vi } from "vitest";

import { has_session_been_synced } from "./initialSyncStore";
import {
  ANONYMOUS_SESSION_SYNC_MARKER,
  build_legacy_verified_session_sync_marker,
  build_verified_user_session_sync_marker,
  mock_app_settings_store,
  reset_session_sync_test_state,
  SESSION_SYNC_KEY,
  set_signed_in_clerk_session_state,
  set_signed_in_without_loaded_user,
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

describe("has_session_been_synced while signed out", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
  });

  it.each([
    ["", false],
    ["false", false],
    ["true", true],
    [ANONYMOUS_SESSION_SYNC_MARKER, true],
    [build_verified_user_session_sync_marker("session-1", "user-1"), true],
  ])("treats stored marker %s as synced=%s", async (raw_marker, expected) => {
    mock_app_settings_store[SESSION_SYNC_KEY] = raw_marker;

    expect(await has_session_been_synced()).toBe(expected);
  });
});

describe("has_session_been_synced while signed in", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    set_signed_in_clerk_session_state("session-2", "user-1");
  });

  it("is true for a user marker written by the current session", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_user_session_sync_marker("session-2", "user-1");

    expect(await has_session_been_synced()).toBe(true);
  });

  it("is false for the same user in a new session so a fresh login sync runs", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_user_session_sync_marker("session-1", "user-1");

    expect(await has_session_been_synced()).toBe(false);
  });

  it("is true for a legacy marker written by the current session", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_legacy_verified_session_sync_marker("session-2");

    expect(await has_session_been_synced()).toBe(true);
  });

  it("is false for a legacy marker written by another session", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_legacy_verified_session_sync_marker("session-1");

    expect(await has_session_been_synced()).toBe(false);
  });

  it.each(["true", ANONYMOUS_SESSION_SYNC_MARKER, "", "{not json"])(
    "is false for unowned marker %s",
    async (raw_marker) => {
      const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mock_app_settings_store[SESSION_SYNC_KEY] = raw_marker;

      expect(await has_session_been_synced()).toBe(false);
      warn_spy.mockRestore();
    },
  );

  it("matches by session when the user is not loaded yet", async () => {
    set_signed_in_without_loaded_user("session-2");
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_user_session_sync_marker("session-2", "user-1");

    expect(await has_session_been_synced()).toBe(true);
  });
});
