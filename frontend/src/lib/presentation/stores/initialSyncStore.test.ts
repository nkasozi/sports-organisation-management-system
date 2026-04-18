import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClerkSessionState } from "$lib/adapters/iam/clerkAuthTypes";

import {
  clear_session_sync_flag,
  has_session_been_synced,
  initial_sync_store,
} from "./initialSyncStore";

const SESSION_SYNC_KEY = "sports_org_session_synced";
const ANONYMOUS_SESSION_SYNC_MARKER = JSON.stringify({ mode: "anonymous" });

function build_verified_session_sync_marker(session_id: string): string {
  return JSON.stringify({ mode: "verified", session_id });
}

const { mock_clerk_session_store, mock_initialize_clerk } = vi.hoisted(() => {
  const mock_clerk_session_store = {
    current: {
      is_loaded: false,
      is_signed_in: false,
      user_state: { status: "missing" as const },
      session_id_state: { status: "missing" as const },
    } as ClerkSessionState,
    subscribe(callback: (value: unknown) => void): () => void {
      callback(mock_clerk_session_store.current);
      return (): void => {};
    },
  };
  const mock_initialize_clerk = vi.fn(async () => true);

  return {
    mock_clerk_session_store,
    mock_initialize_clerk,
  };
});

function set_signed_out_clerk_session_state(): void {
  mock_clerk_session_store.current = {
    is_loaded: true,
    is_signed_in: false,
    user_state: { status: "missing" },
    session_id_state: { status: "missing" },
  };
}

function set_signed_in_clerk_session_state(session_id: string): void {
  mock_clerk_session_store.current = {
    is_loaded: true,
    is_signed_in: true,
    user_state: { status: "missing" },
    session_id_state: { status: "present", session_id },
  };
}

const mock_app_settings_store = {} as Record<string, string>;

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  clerk_session: {
    subscribe: (callback: (value: unknown) => void) =>
      mock_clerk_session_store.subscribe(callback),
  },
  initialize_clerk: mock_initialize_clerk,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: (key: string) =>
      Promise.resolve(mock_app_settings_store[key] ?? ""),
    set_setting: (key: string, value: string) => {
      mock_app_settings_store[key] = value;
      return Promise.resolve();
    },
    remove_setting: (key: string) => {
      delete mock_app_settings_store[key];
      return Promise.resolve();
    },
    clear_all_settings: () => {
      Object.keys(mock_app_settings_store).forEach(
        (k) => delete mock_app_settings_store[k],
      );
      return Promise.resolve();
    },
  }),
}));

describe("has_session_been_synced", () => {
  beforeEach(() => {
    Object.keys(mock_app_settings_store).forEach(
      (k) => delete mock_app_settings_store[k],
    );
    mock_initialize_clerk.mockClear();
    set_signed_out_clerk_session_state();
  });

  it("returns false when session flag is not set", async () => {
    expect(await has_session_been_synced()).toBe(false);
  });

  it("returns false when session flag is set to a non-true value", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] = "false";
    expect(await has_session_been_synced()).toBe(false);
  });

  it("returns true when a legacy session flag is present without an active clerk session", async () => {
    mock_app_settings_store[SESSION_SYNC_KEY] = "true";
    expect(await has_session_been_synced()).toBe(true);
  });

  it("returns false when a legacy session flag is present for an active clerk session", async () => {
    set_signed_in_clerk_session_state("session-1");
    mock_app_settings_store[SESSION_SYNC_KEY] = "true";

    expect(await has_session_been_synced()).toBe(false);
  });

  it("returns false when an anonymous marker is present for an active clerk session", async () => {
    set_signed_in_clerk_session_state("session-1");
    mock_app_settings_store[SESSION_SYNC_KEY] = ANONYMOUS_SESSION_SYNC_MARKER;

    expect(await has_session_been_synced()).toBe(false);
  });

  it("returns true when a verified marker matches the active clerk session", async () => {
    set_signed_in_clerk_session_state("session-1");
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_session_sync_marker("session-1");

    expect(await has_session_been_synced()).toBe(true);
  });

  it("returns false when a verified marker does not match the active clerk session", async () => {
    set_signed_in_clerk_session_state("session-2");
    mock_app_settings_store[SESSION_SYNC_KEY] =
      build_verified_session_sync_marker("session-1");

    expect(await has_session_been_synced()).toBe(false);
  });
});

describe("clear_session_sync_flag", () => {
  beforeEach(() => {
    Object.keys(mock_app_settings_store).forEach(
      (k) => delete mock_app_settings_store[k],
    );
    mock_initialize_clerk.mockClear();
    set_signed_out_clerk_session_state();
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
    Object.keys(mock_app_settings_store).forEach(
      (k) => delete mock_app_settings_store[k],
    );
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
    await initial_sync_store.complete_sync();

    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(true);
    expect(state.progress_percentage).toBe(100);
  });

  it("complete_sync marks anonymous sync when no clerk session is active", async () => {
    await initial_sync_store.complete_sync();

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      ANONYMOUS_SESSION_SYNC_MARKER,
    );
  });

  it("complete_sync marks verified sync for the active clerk session", async () => {
    set_signed_in_clerk_session_state("session-1");

    await initial_sync_store.complete_sync();

    expect(mock_app_settings_store[SESSION_SYNC_KEY]).toBe(
      build_verified_session_sync_marker("session-1"),
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
    set_signed_in_clerk_session_state("session-1");

    expect(await has_session_been_synced()).toBe(false);

    initial_sync_store.start_sync();
    expect(get(initial_sync_store).is_syncing).toBe(true);

    initial_sync_store.update_progress("Syncing players...", 50);
    expect(get(initial_sync_store).progress_percentage).toBe(50);

    await initial_sync_store.complete_sync();
    expect(get(initial_sync_store).sync_complete).toBe(true);
    expect(await has_session_been_synced()).toBe(true);
  });

  it("full reset cycle: complete → clear_flag → has_session_been_synced returns false", async () => {
    await initial_sync_store.complete_sync();
    expect(await has_session_been_synced()).toBe(true);

    await clear_session_sync_flag();
    expect(await has_session_been_synced()).toBe(false);
  });
});
