import { render } from "svelte/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  LastSyncTimeState,
  SyncErrorState,
  SyncProgressState,
} from "$lib/presentation/stores/syncStoreTypes";

import SyncStatusIndicator from "./SyncStatusIndicator.svelte";

const sync_indicator_store_state = vi.hoisted(() => {
  let is_syncing_value = false;
  let last_sync_time_state: LastSyncTimeState = { status: "never" };
  let sync_error_state: SyncErrorState = { status: "clear" };
  let sync_percentage_value = 0;
  let sync_progress_value: SyncProgressState = { status: "idle" };

  return {
    reset(): void {
      is_syncing_value = false;
      last_sync_time_state = { status: "never" };
      sync_error_state = { status: "clear" };
      sync_percentage_value = 0;
      sync_progress_value = { status: "idle" };
    },
    set_state(command: {
      is_syncing?: boolean;
      last_sync_time?: LastSyncTimeState;
      sync_error?: SyncErrorState;
      sync_percentage?: number;
      sync_progress?: SyncProgressState;
    }): void {
      if (Object.prototype.hasOwnProperty.call(command, "is_syncing"))
        is_syncing_value = command.is_syncing as boolean;
      if (Object.prototype.hasOwnProperty.call(command, "last_sync_time"))
        last_sync_time_state = command.last_sync_time as LastSyncTimeState;
      if (Object.prototype.hasOwnProperty.call(command, "sync_error"))
        sync_error_state = command.sync_error as SyncErrorState;
      if (Object.prototype.hasOwnProperty.call(command, "sync_percentage"))
        sync_percentage_value = command.sync_percentage as number;
      if (Object.prototype.hasOwnProperty.call(command, "sync_progress"))
        sync_progress_value = command.sync_progress as SyncProgressState;
    },
    subscribe_is_syncing(subscriber: (value: boolean) => void): () => void {
      subscriber(is_syncing_value);
      return () => {};
    },
    subscribe_last_sync_time(
      subscriber: (value: LastSyncTimeState) => void,
    ): () => void {
      subscriber(last_sync_time_state);
      return () => {};
    },
    subscribe_sync_error(
      subscriber: (value: SyncErrorState) => void,
    ): () => void {
      subscriber(sync_error_state);
      return () => {};
    },
    subscribe_sync_percentage(subscriber: (value: number) => void): () => void {
      subscriber(sync_percentage_value);
      return () => {};
    },
    subscribe_sync_progress(
      subscriber: (value: SyncProgressState) => void,
    ): () => void {
      subscriber(sync_progress_value);
      return () => {};
    },
  };
});

vi.mock("$lib/presentation/stores/syncStore", () => ({
  sync_store: {
    sync_now: vi.fn(),
  },
}));

vi.mock("$lib/presentation/stores/syncStoreDerived", () => ({
  is_syncing: { subscribe: sync_indicator_store_state.subscribe_is_syncing },
  last_sync_time: {
    subscribe: sync_indicator_store_state.subscribe_last_sync_time,
  },
  sync_error: { subscribe: sync_indicator_store_state.subscribe_sync_error },
  sync_percentage: {
    subscribe: sync_indicator_store_state.subscribe_sync_percentage,
  },
  sync_progress: {
    subscribe: sync_indicator_store_state.subscribe_sync_progress,
  },
}));

describe("SyncStatusIndicator", () => {
  beforeEach(() => {
    sync_indicator_store_state.reset();
    vi.stubGlobal("clearInterval", vi.fn());
    vi.stubGlobal(
      "setInterval",
      vi.fn(() => 1),
    );
  });

  it("renders an error-state icon color override for header usage", () => {
    sync_indicator_store_state.set_state({
      last_sync_time: {
        status: "recorded",
        value: "2024-05-01T10:00:00.000Z",
      },
      sync_error: { status: "present", message: "Sync failed" },
    });

    const rendered_markup = render(SyncStatusIndicator).body;

    expect(rendered_markup).toContain("sync-status-indicator");
    expect(rendered_markup).toContain(
      "--sync-status-color: rgb(239 68 68 / 1);",
    );
  });
});
