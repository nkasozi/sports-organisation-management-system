import { describe, it, expect, beforeEach, vi } from "vitest";

const SESSION_SYNC_KEY = "sports_org_session_synced";

function setup_session_storage(initial_value: string | null = null): void {
  const store: Record<string, string> = {};
  if (initial_value !== null) {
    store[SESSION_SYNC_KEY] = initial_value;
  }

  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).sessionStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
}

import {
  has_session_been_synced,
  clear_session_sync_flag,
  initial_sync_store,
} from "./initialSyncStore";
import { get } from "svelte/store";

describe("has_session_been_synced", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true when window is undefined (SSR — assume synced to avoid loops)", () => {
    const original_window = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;

    expect(has_session_been_synced()).toBe(true);

    (globalThis as Record<string, unknown>).window = original_window;
  });

  it("returns false when session flag is not set", () => {
    setup_session_storage(null);
    expect(has_session_been_synced()).toBe(false);
  });

  it("returns false when session flag is set to a non-true value", () => {
    setup_session_storage("false");
    expect(has_session_been_synced()).toBe(false);
  });

  it("returns true when session flag is set to 'true'", () => {
    setup_session_storage("true");
    expect(has_session_been_synced()).toBe(true);
  });
});

describe("clear_session_sync_flag", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("is a no-op when window is undefined (SSR)", () => {
    const original_window = (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).window;

    expect(() => clear_session_sync_flag()).not.toThrow();

    (globalThis as Record<string, unknown>).window = original_window;
  });

  it("removes the session sync flag from sessionStorage", () => {
    setup_session_storage("true");
    expect(has_session_been_synced()).toBe(true);

    clear_session_sync_flag();

    const session_storage = (globalThis as Record<string, unknown>).sessionStorage as {
      removeItem: ReturnType<typeof vi.fn>;
    };
    expect(session_storage.removeItem).toHaveBeenCalledWith(SESSION_SYNC_KEY);
  });

  it("after clearing, has_session_been_synced returns false", () => {
    const store: Record<string, string> = { [SESSION_SYNC_KEY]: "true" };
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).sessionStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };

    expect(has_session_been_synced()).toBe(true);
    clear_session_sync_flag();
    expect(has_session_been_synced()).toBe(false);
  });

  it("can be called multiple times without error", () => {
    setup_session_storage(null);
    expect(() => {
      clear_session_sync_flag();
      clear_session_sync_flag();
    }).not.toThrow();
  });
});

describe("initial_sync_store", () => {
  beforeEach(() => {
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

  it("complete_sync sets is_syncing false, sync_complete true, and progress to 100", () => {
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).sessionStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };

    initial_sync_store.start_sync();
    initial_sync_store.complete_sync();

    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(true);
    expect(state.progress_percentage).toBe(100);
  });

  it("complete_sync marks the session as synced in sessionStorage", () => {
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).sessionStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };

    initial_sync_store.complete_sync();

    const session_storage = (globalThis as Record<string, unknown>).sessionStorage as {
      setItem: ReturnType<typeof vi.fn>;
    };
    expect(session_storage.setItem).toHaveBeenCalledWith(SESSION_SYNC_KEY, "true");
  });

  it("reset returns store to initial state without affecting sessionStorage", () => {
    initial_sync_store.start_sync();
    initial_sync_store.update_progress("Loading...", 60);
    initial_sync_store.reset();

    const state = get(initial_sync_store);
    expect(state.is_syncing).toBe(false);
    expect(state.sync_complete).toBe(false);
    expect(state.progress_percentage).toBe(0);
    expect(state.status_message).toBe("");
  });

  it("full login sync cycle: start → progress updates → complete sets synced flag", () => {
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).sessionStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };

    expect(has_session_been_synced()).toBe(false);

    initial_sync_store.start_sync();
    expect(get(initial_sync_store).is_syncing).toBe(true);

    initial_sync_store.update_progress("Syncing players...", 50);
    expect(get(initial_sync_store).progress_percentage).toBe(50);

    initial_sync_store.complete_sync();
    expect(get(initial_sync_store).sync_complete).toBe(true);
    expect(has_session_been_synced()).toBe(true);
  });

  it("full reset cycle: complete → clear_flag → has_session_been_synced returns false", () => {
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).sessionStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    };

    initial_sync_store.complete_sync();
    expect(has_session_been_synced()).toBe(true);

    clear_session_sync_flag();
    expect(has_session_been_synced()).toBe(false);
  });
});
