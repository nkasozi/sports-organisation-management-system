import { render } from "svelte/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sync_indicator_store_state = vi.hoisted(() => {
  let is_syncing_value = false;
  let last_sync_time_value: string | null = null;
  let sync_error_value: string | null = null;
  let sync_percentage_value = 0;
  let sync_progress_value: { table_name?: string } | null = null;

  return {
    reset(): void {
      is_syncing_value = false;
      last_sync_time_value = null;
      sync_error_value = null;
      sync_percentage_value = 0;
      sync_progress_value = null;
    },
    set_state(command: {
      is_syncing?: boolean;
      last_sync_time?: string | null;
      sync_error?: string | null;
      sync_percentage?: number;
      sync_progress?: { table_name?: string } | null;
    }): void {
      if (command.is_syncing !== undefined)
        is_syncing_value = command.is_syncing;
      if (command.last_sync_time !== undefined)
        last_sync_time_value = command.last_sync_time;
      if (command.sync_error !== undefined)
        sync_error_value = command.sync_error;
      if (command.sync_percentage !== undefined)
        sync_percentage_value = command.sync_percentage;
      if (command.sync_progress !== undefined)
        sync_progress_value = command.sync_progress;
    },
    subscribe_is_syncing(subscriber: (value: boolean) => void): () => void {
      subscriber(is_syncing_value);
      return () => undefined;
    },
    subscribe_last_sync_time(
      subscriber: (value: string | null) => void,
    ): () => void {
      subscriber(last_sync_time_value);
      return () => undefined;
    },
    subscribe_sync_error(
      subscriber: (value: string | null) => void,
    ): () => void {
      subscriber(sync_error_value);
      return () => undefined;
    },
    subscribe_sync_percentage(subscriber: (value: number) => void): () => void {
      subscriber(sync_percentage_value);
      return () => undefined;
    },
    subscribe_sync_progress(
      subscriber: (value: { table_name?: string } | null) => void,
    ): () => void {
      subscriber(sync_progress_value);
      return () => undefined;
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

import SyncStatusIndicator from "./SyncStatusIndicator.svelte";

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
      last_sync_time: "2024-05-01T10:00:00.000Z",
      sync_error: "Sync failed",
    });

    const rendered_markup = render(SyncStatusIndicator).body;

    expect(rendered_markup).toContain("sync-status-indicator");
    expect(rendered_markup).toContain(
      "--sync-status-color: rgb(239 68 68 / 1);",
    );
  });
});
