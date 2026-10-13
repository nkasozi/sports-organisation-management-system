import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncConfig } from "$lib/infrastructure/sync/convexSyncService";

import {
  create_conflict_sync_result,
  create_pending_team_conflict,
  prepare_sync_store_test,
} from "./syncStore.test_support";

const sync_store_mocks = await vi.hoisted(async () =>
  (await import("./syncStore.test_support")).create_sync_store_mocks(),
);

vi.mock("$lib/infrastructure/sync/convexSyncService", async () =>
  (await import("./syncStore.test_support")).create_sync_service_module_mock(
    sync_store_mocks,
  ),
);
vi.mock("$lib/presentation/stores/conflictStoreSyncReviewInstance", () => ({
  sync_review_store: { add_from_sync_result: vi.fn(() => false) },
}));
vi.mock("$lib/presentation/stores/conflictStore", async () =>
  (await import("./syncStore.test_support")).create_conflict_store_module_mock(
    sync_store_mocks,
  ),
);
vi.mock("./syncStoreResolveConflict", () => ({
  execute_conflict_resolution: sync_store_mocks.execute_conflict_resolution,
}));

describe("syncStore", () => {
  beforeEach(() => {
    prepare_sync_store_test(sync_store_mocks);
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
    const sync_config = { direction: "pull" } as Partial<SyncConfig>;

    const { sync_store } = await import("./syncStore");
    const manager = sync_store.initialize(sync_config);

    expect(manager).toBe(sync_store_mocks.manager);
    expect(sync_store_mocks.initialize_sync_manager).toHaveBeenCalledWith(
      sync_config,
    );
    expect(get(sync_store)).toMatchObject({
      is_configured: true,
      last_sync_at: {
        status: "recorded",
        value: "2024-04-30T09:00:00.000Z",
      },
    });
  });

  it("records sync conflicts and exposes the failure state", async () => {
    const conflict_result = {
      ...create_conflict_sync_result("team-1", 25),
      tables_synced: 1,
      records_pushed: 2,
      records_pulled: 3,
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
      current_progress: { status: "idle" },
      error_message: {
        status: "present",
        message: "Conflicts detected. Please review and resolve.",
      },
      has_pending_conflicts: true,
      last_sync_at: { status: "recorded", value: "2024-05-01T10:00:00.000Z" },
      last_sync_result: { status: "recorded", result: conflict_result },
    });
  });

  it("clears pending conflicts after a successful conflict resolution", async () => {
    const sync_failure_with_conflict = create_conflict_sync_result(
      "team-2",
      20,
    );

    sync_store_mocks.manager.sync_now.mockResolvedValue(
      sync_failure_with_conflict,
    );
    sync_store_mocks.manager.get_convex_client.mockReturnValue({
      success: true,
      data: { mutation: vi.fn(), query: vi.fn() },
    });
    sync_store_mocks.execute_conflict_resolution.mockResolvedValue({
      success: true,
    });

    const { sync_store } = await import("./syncStore");

    await sync_store.sync_now();
    const result = await sync_store.resolve_conflict_and_sync(
      create_pending_team_conflict("team-2"),
      "keep_remote",
    );

    expect(result).toEqual({ success: true });
    expect(sync_store_mocks.execute_conflict_resolution).toHaveBeenCalled();
    expect(get(sync_store).has_pending_conflicts).toBe(false);
  });
});
