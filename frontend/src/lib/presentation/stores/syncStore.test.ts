import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncConfig } from "$lib/infrastructure/sync/convexSyncService";

const sync_store_mocks = vi.hoisted(() => {
  const manager = {
    convex_client: null as unknown,
    is_configured: vi.fn(),
    set_convex_client: vi.fn(),
    sync_now: vi.fn(),
    start_auto_sync: vi.fn(),
    stop_auto_sync: vi.fn(),
    update_config: vi.fn(),
  };

  return {
    manager,
    initialize_sync_manager: vi.fn(() => manager),
    get_sync_manager: vi.fn(() => manager),
    get_last_sync_timestamp: vi.fn(),
    add_conflicts_from_sync_response: vi.fn(),
    execute_conflict_resolution: vi.fn(),
  };
});

vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  get_last_sync_timestamp: sync_store_mocks.get_last_sync_timestamp,
  get_sync_manager: sync_store_mocks.get_sync_manager,
  initialize_sync_manager: sync_store_mocks.initialize_sync_manager,
}));

vi.mock("$lib/presentation/stores/conflictStore", () => ({
  conflict_store: {
    add_conflicts_from_sync_response:
      sync_store_mocks.add_conflicts_from_sync_response,
  },
}));

vi.mock("./syncStoreResolveConflict", () => ({
  execute_conflict_resolution: sync_store_mocks.execute_conflict_resolution,
}));

describe("syncStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-01T10:00:00.000Z"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sync_store_mocks.manager.convex_client = null;
    sync_store_mocks.manager.is_configured.mockReset();
    sync_store_mocks.manager.set_convex_client.mockReset();
    sync_store_mocks.manager.sync_now.mockReset();
    sync_store_mocks.manager.start_auto_sync.mockReset();
    sync_store_mocks.manager.stop_auto_sync.mockReset();
    sync_store_mocks.manager.update_config.mockReset();
    sync_store_mocks.initialize_sync_manager.mockClear();
    sync_store_mocks.get_sync_manager.mockClear();
    sync_store_mocks.get_last_sync_timestamp.mockReset();
    sync_store_mocks.add_conflicts_from_sync_response.mockReset();
    sync_store_mocks.execute_conflict_resolution.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initializes from the sync manager and stored timestamp", async () => {
    sync_store_mocks.manager.is_configured.mockReturnValue(true);
    sync_store_mocks.get_last_sync_timestamp.mockReturnValue(
      "2024-04-30T09:00:00.000Z",
    );
    const sync_config =  { direction: "pull" } as Partial<SyncConfig>;

    const { sync_store } = await import("./syncStore");
    const manager = sync_store.initialize(sync_config);

    expect(manager).toBe(sync_store_mocks.manager);
    expect(sync_store_mocks.initialize_sync_manager).toHaveBeenCalledWith(
      sync_config,
    );
    expect(get(sync_store)).toMatchObject({
      is_configured: true,
      last_sync_at: "2024-04-30T09:00:00.000Z",
    });
  });

  it("records sync conflicts and exposes the failure state", async () => {
    const conflict_result = {
      success: false,
      tables_synced: 1,
      records_pushed: 2,
      records_pulled: 3,
      errors: [{ table_name: "teams", error: "conflict detected" }],
      duration_ms: 25,
      conflicts: [
        {
          table_name: "teams",
          conflicts: [
            {
              local_id: "team-1",
              local_data: { name: "Local Team" },
              local_version: 1,
              remote_data: { name: "Remote Team" },
              remote_version: 2,
              remote_updated_at: "2024-04-30T09:00:00.000Z",
              remote_updated_by: null,
            },
          ],
        },
      ],
    };
    sync_store_mocks.manager.sync_now.mockImplementation(
      async (handle_progress: (progress: Record<string, unknown>) => void) => {
        handle_progress({ status: "syncing", percentage: 40 });
        return conflict_result;
      },
    );

    const { sync_store } = await import("./syncStore");

    const result = await sync_store.sync_now("push");

    expect(result).toEqual(conflict_result);
    expect(
      sync_store_mocks.add_conflicts_from_sync_response,
    ).toHaveBeenCalledWith("teams", conflict_result.conflicts[0].conflicts);
    expect(get(sync_store)).toMatchObject({
      is_syncing: false,
      current_progress: null,
      error_message: "Conflicts detected. Please review and resolve.",
      has_pending_conflicts: true,
      last_sync_at: "2024-05-01T10:00:00.000Z",
      last_sync_result: conflict_result,
    });
  });

  it("surfaces the first sync error message when a sync fails without conflicts", async () => {
    const failed_result = {
      success: false,
      tables_synced: 0,
      records_pushed: 0,
      records_pulled: 0,
      errors: [
        {
          table_name: "teams",
          error:
            'Record "team-1" in "teams" is too large to sync. Choose a smaller image and try again.',
        },
      ],
      duration_ms: 30,
      conflicts: [],
    };
    sync_store_mocks.manager.sync_now.mockResolvedValue(failed_result);

    const { sync_store } = await import("./syncStore");

    const result = await sync_store.sync_now("push");

    expect(result).toEqual(failed_result);
    expect(get(sync_store)).toMatchObject({
      is_syncing: false,
      error_message: failed_result.errors[0].error,
      has_pending_conflicts: false,
      last_sync_result: failed_result,
    });
  });

  it("converts thrown sync errors into a failed sync result", async () => {
    sync_store_mocks.manager.sync_now.mockRejectedValue(
      new Error("network down"),
    );

    const { sync_store } = await import("./syncStore");

    const result = await sync_store.sync_now();

    expect(result).toEqual({
      success: false,
      tables_synced: 0,
      records_pushed: 0,
      records_pulled: 0,
      errors: [{ table_name: "unknown", error: "network down" }],
      duration_ms: 0,
      conflicts: [],
    });
    expect(get(sync_store)).toMatchObject({
      is_syncing: false,
      error_message: "network down",
      has_pending_conflicts: false,
    });
  });

  it("clears pending conflicts after a successful conflict resolution", async () => {
    const sync_failure_with_conflict = {
      success: false,
      tables_synced: 0,
      records_pushed: 0,
      records_pulled: 0,
      errors: [{ table_name: "teams", error: "conflict detected" }],
      duration_ms: 20,
      conflicts: [
        {
          table_name: "teams",
          conflicts: [
            {
              local_id: "team-2",
              local_data: { name: "Local Team" },
              local_version: 1,
              remote_data: { name: "Remote Team" },
              remote_version: 2,
              remote_updated_at: "2024-04-30T09:00:00.000Z",
              remote_updated_by: null,
            },
          ],
        },
      ],
    };

    sync_store_mocks.manager.sync_now.mockResolvedValue(
      sync_failure_with_conflict,
    );
    sync_store_mocks.manager.convex_client = {
      mutation: vi.fn(),
      query: vi.fn(),
    };
    sync_store_mocks.execute_conflict_resolution.mockResolvedValue({
      success: true,
      error: null,
    });

    const { sync_store } = await import("./syncStore");

    await sync_store.sync_now();
    const result = await sync_store.resolve_conflict_and_sync(
      {
        id: "conflict-1",
        table_name: "teams",
        local_id: "team-2",
        entity_display_name: "Team B",
        local_data: { name: "Local Team" },
        remote_data: { name: "Remote Team" },
        local_updated_at: "2024-04-29T00:00:00.000Z",
        remote_updated_at: "2024-04-30T00:00:00.000Z",
        remote_updated_by: null,
        remote_updated_by_name: null,
        field_differences: [],
        detected_at: "2024-05-01T09:59:00.000Z",
      },
      "keep_remote",
    );

    expect(result).toEqual({ success: true, error: null });
    expect(sync_store_mocks.execute_conflict_resolution).toHaveBeenCalled();
    expect(get(sync_store).has_pending_conflicts).toBe(false);
  });
});
