import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prepare_sync_store_test } from "./syncStore.test_support";

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

describe("syncStore failures", () => {
  beforeEach(() => {
    prepare_sync_store_test(sync_store_mocks);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      error_message: {
        status: "present",
        message: failed_result.errors[0].error,
      },
      has_pending_conflicts: false,
      last_sync_result: { status: "recorded", result: failed_result },
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
      rejected_records: [],
      deleted_remotely: [],
    });
    expect(get(sync_store)).toMatchObject({
      is_syncing: false,
      error_message: { status: "present", message: "network down" },
      has_pending_conflicts: false,
    });
  });

  it("surfaces server-rejected local changes even when the run succeeded", async () => {
    sync_store_mocks.manager.sync_now.mockResolvedValue({
      success: true,
      tables_synced: 1,
      records_pushed: 0,
      records_pulled: 0,
      errors: [],
      duration_ms: 1,
      conflicts: [],
      rejected_records: [
        {
          table_name: "teams",
          local_id: "team_1",
          rejection_code: "rejected_wrong_organization",
          rejection_message:
            "Record organization does not match caller organization",
        },
      ],
    });

    const { sync_store } = await import("./syncStore");

    await sync_store.sync_now();

    expect(get(sync_store).error_message).toEqual({
      status: "present",
      message:
        "1 local change(s) were rejected by the server and have not been synced.",
    });
  });
});
