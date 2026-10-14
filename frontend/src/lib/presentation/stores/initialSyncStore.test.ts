import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clear_session_sync_flag,
  has_session_been_synced,
  initial_sync_store,
} from "./initialSyncStore";
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

describe("clear_session_sync_flag", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
  });

  it("removes the session sync flag", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] = "true";
    expect(await has_session_been_synced()).toBe(true);

    await clear_session_sync_flag();

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBeUndefined();
  });

  it("after clearing, has_session_been_synced returns false", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] = "true";
    expect(await has_session_been_synced()).toBe(true);

    await clear_session_sync_flag();
    expect(await has_session_been_synced()).toBe(false);
  });

  it("can be called multiple times without error", async () => {
    await expect(clear_session_sync_flag()).resolves.toBeUndefined();
    await expect(clear_session_sync_flag()).resolves.toBeUndefined();
  });
});

describe("initial_sync_store", () => {
  beforeEach(() => {
    reset_session_sync_test_state();
    initial_sync_store.reset();
  });

  it("starts in a non-syncing, not-complete state", () => {
    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(false);
    expect(state.progress_percentage).toBe(0);
    expect(state.status_message).toBe("");
  });

  it("start_sync sets is_syncing to true and resets sync_complete", () => {
    initial_sync_store.start_sync();
    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(true);
    expect(state.sync_complete).toBe(false);
    expect(state.progress_percentage).toBeGreaterThan(0);
  });

  it("update_progress updates message and percentage without clearing is_syncing", () => {
    initial_sync_store.start_sync();
    initial_sync_store.update_progress("Syncing teams...", 45);
    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(true);
    expect(state.status_message).toBe("Syncing teams...");
    expect(state.progress_percentage).toBe(45);
  });

  it("complete_sync sets is_syncing false, sync_complete true, and progress to 100", async () => {
    initial_sync_store.start_sync();
    expect((await initial_sync_store.complete_sync()).success).toBe(true);

    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(true);
    expect(state.progress_percentage).toBe(100);
  });

  it("complete_sync marks anonymous sync when no clerk session is active", async () => {
    expect((await initial_sync_store.complete_sync()).success).toBe(true);

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      ANONYMOUS_SESSION_SYNC_MARKER,
    );
  });

  it("complete_sync marks the session as synced for the stable user identity", async () => {
    set_signed_in_clerk_session_state("session-1", "user-1");

    expect((await initial_sync_store.complete_sync()).success).toBe(true);

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      build_verified_user_session_sync_marker("session-1", "user-1"),
    );
  });

  it("complete_sync writes a session-only marker when the user is not loaded", async () => {
    set_signed_in_without_loaded_user("session-1");

    expect((await initial_sync_store.complete_sync()).success).toBe(true);

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      build_legacy_verified_session_sync_marker("session-1"),
    );
  });

  it("reset returns store to initial state", () => {
    initial_sync_store.start_sync();
    initial_sync_store.update_progress("Loading...", 60);
    initial_sync_store.reset();

    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(false);
    expect(state.progress_percentage).toBe(0);
    expect(state.status_message).toBe("");
  });

  it("full login sync cycle: start → progress updates → complete sets a matching verified marker", async () => {
    set_signed_in_clerk_session_state("session-1", "user-1");

    expect(await has_session_been_synced()).toBe(false);

    initial_sync_store.start_sync();
    expect(get(initial_sync_store).is_syncing).toBe(true);

    initial_sync_store.update_progress("Syncing players...", 50);
    expect(get(initial_sync_store).progress_percentage).toBe(50);

    expect((await initial_sync_store.complete_sync()).success).toBe(true);
    expect(get(initial_sync_store).sync_complete).toBe(true);
    expect(await has_session_been_synced()).toBe(true);
  });

  it("full reset cycle: complete → clear_flag → has_session_been_synced returns false", async () => {
    expect((await initial_sync_store.complete_sync()).success).toBe(true);
    expect(await has_session_been_synced()).toBe(true);

    await clear_session_sync_flag();
    expect(await has_session_been_synced()).toBe(false);
  });
});
