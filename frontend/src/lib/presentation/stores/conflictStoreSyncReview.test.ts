import { get } from "svelte/store";
import { describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { SyncResult } from "$lib/infrastructure/sync/syncTypes";

import { create_sync_review_store } from "./conflictStoreSyncReview";
import {
  SyncReviewDecision,
  type SyncReviewDependencies,
} from "./conflictStoreSyncReviewTypes";

function create_dependencies(): SyncReviewDependencies {
  return {
    restore_remotely_deleted: vi.fn(async () => create_success_result(true)),
    discard_remotely_deleted: vi.fn(async () => create_success_result(true)),
    retry_rejected: vi.fn(async () => create_success_result(true)),
    discard_rejected: vi.fn(async () => create_success_result(true)),
    requeue_conflicts: vi.fn(async () => 2),
    list_rejected: vi.fn(async () => [
      {
        table_name: "teams",
        local_id: "team_b",
        rejection_code: "rejected_wrong_organization",
        rejection_message: "Record organization does not match",
      },
    ]),
    request_push: vi.fn(() => true),
  };
}

function sync_result_with_deletion(): SyncResult {
  return {
    success: true,
    tables_synced: 1,
    records_pushed: 0,
    records_pulled: 0,
    errors: [],
    duration_ms: 1,
    conflicts: [],
    rejected_records: [],
    deleted_remotely: [
      {
        table_name: "teams",
        local_id: "team_a",
        local_data: { name: "Lions" },
        tombstone_version: 6,
        deleted_at: "2024-03-01T00:00:00.000Z",
      },
    ],
  };
}

describe("sync review store", () => {
  it("shows remote deletions from a sync result with the record name", () => {
    const store = create_sync_review_store(create_dependencies());

    store.add_from_sync_result(sync_result_with_deletion());

    const state = get(store);
    expect(state.is_visible).toBe(true);
    expect(state.items).toEqual([
      expect.objectContaining({
        kind: "remote_deletion",
        entity_display_name: "Lions",
      }),
    ]);
  });

  it("restores a remotely deleted record and asks for a push", async () => {
    const dependencies = create_dependencies();
    const store = create_sync_review_store(dependencies);
    store.add_from_sync_result(sync_result_with_deletion());

    await store.decide(get(store).items[0], SyncReviewDecision.KEEP_MINE);

    expect(dependencies.restore_remotely_deleted).toHaveBeenCalledWith(
      "teams",
      "team_a",
    );
    expect(dependencies.request_push).toHaveBeenCalledOnce();
    expect(get(store).items).toEqual([]);
  });

  it("keeps the item and shows a friendly error when the decision fails", async () => {
    const dependencies = create_dependencies();
    dependencies.discard_remotely_deleted = vi.fn(async () =>
      create_failure_result("disk full"),
    );
    const store = create_sync_review_store(dependencies);
    store.add_from_sync_result(sync_result_with_deletion());

    await store.decide(get(store).items[0], SyncReviewDecision.DISCARD_MINE);

    expect(get(store).items).toHaveLength(1);
    expect(get(store).action_state).toMatchObject({
      status: "failed",
      item_id: "teams:team_a",
    });
  });

  it("rebuilds rejected changes and re-queues conflicts after a reload", async () => {
    const dependencies = create_dependencies();
    const store = create_sync_review_store(dependencies);

    await store.restore_from_outbox();

    expect(dependencies.requeue_conflicts).toHaveBeenCalledOnce();
    expect(get(store).items).toEqual([
      expect.objectContaining({
        kind: "rejected_change",
        rejection_message: "Record organization does not match",
      }),
    ]);
  });

  it("retries or discards rejected changes through the outbox", async () => {
    const dependencies = create_dependencies();
    const store = create_sync_review_store(dependencies);
    await store.restore_from_outbox();

    await store.decide(get(store).items[0], SyncReviewDecision.DISCARD_MINE);

    expect(dependencies.discard_rejected).toHaveBeenCalledWith(
      "teams",
      "team_b",
    );
    expect(dependencies.request_push).not.toHaveBeenCalled();
  });

  it("shows a single remote deletion found while resolving a conflict", () => {
    const store = create_sync_review_store(create_dependencies());

    expect(
      store.add_remote_deletion(
        sync_result_with_deletion().deleted_remotely[0],
      ),
    ).toBe(true);

    expect(get(store)).toMatchObject({
      is_visible: true,
      items: [{ kind: "remote_deletion", local_id: "team_a" }],
    });
  });
});
