import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncProgress } from "$lib/infrastructure/sync/convexSyncService";

import {
  has_pending_conflicts,
  is_syncing,
  last_sync_time,
  sync_error,
  sync_percentage,
  sync_progress,
  sync_status,
} from "./syncStoreDerived";
import type { SyncState } from "./syncStoreTypes";

const sync_store_mock = vi.hoisted(() => {
  let current_value = {
    is_configured: false,
    is_syncing: false,
    last_sync_at: { status: "never" },
    last_sync_result: { status: "empty" },
    current_progress: { status: "idle" },
    auto_sync_enabled: false,
    error_message: { status: "clear" },
    has_pending_conflicts: false,
  } as SyncState;
  const subscribers = new Set<(value: SyncState) => void>();

  return {
    set_state: (next_value: SyncState): void => {
      current_value = next_value;
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
    sync_store: {
      subscribe(subscriber: (value: SyncState) => void): () => void {
        subscriber(current_value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
    },
  };
});

vi.mock("./syncStore", () => ({
  sync_store: sync_store_mock.sync_store,
}));

describe("syncStoreDerived", () => {
  beforeEach(() => {
    sync_store_mock.set_state({
      is_configured: false,
      is_syncing: false,
      last_sync_at: { status: "never" },
      last_sync_result: { status: "empty" },
      current_progress: { status: "idle" },
      auto_sync_enabled: false,
      error_message: { status: "clear" },
      has_pending_conflicts: false,
    });
  });

  it("defaults to an idle sync state when no progress exists", () => {
    expect(get(is_syncing)).toBe(false);
    expect(get(sync_progress)).toEqual({ status: "idle" });
    expect(get(sync_percentage)).toBe(0);
    expect(get(sync_status)).toBe("idle");
    expect(get(last_sync_time)).toEqual({ status: "never" });
    expect(get(sync_error)).toEqual({ status: "clear" });
    expect(get(has_pending_conflicts)).toBe(false);
  });

  it("projects active sync progress, timestamps, and conflict flags", () => {
    const progress = {
      percentage: 45,
      status: "syncing",
      table_name: "players",
      total_records: 100,
      synced_records: 45,
      errors: [],
      tables_completed: 1,
      total_tables: 3,
    } as SyncProgress;

    sync_store_mock.set_state({
      is_configured: true,
      is_syncing: true,
      last_sync_at: { status: "recorded", value: "2024-05-01T10:00:00.000Z" },
      last_sync_result: { status: "empty" },
      current_progress: { status: "active", progress },
      auto_sync_enabled: true,
      error_message: { status: "present", message: "sync stalled" },
      has_pending_conflicts: true,
    });

    expect(get(is_syncing)).toBe(true);
    expect(get(sync_progress)).toEqual({ status: "active", progress });
    expect(get(sync_percentage)).toBe(45);
    expect(get(sync_status)).toBe("syncing");
    expect(get(last_sync_time)).toEqual({
      status: "recorded",
      value: "2024-05-01T10:00:00.000Z",
    });
    expect(get(sync_error)).toEqual({
      status: "present",
      message: "sync stalled",
    });
    expect(get(has_pending_conflicts)).toBe(true);
  });
});
