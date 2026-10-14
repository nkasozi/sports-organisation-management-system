import { describe, expect, it, vi } from "vitest";

import {
  type ChangeTrackingGate,
  create_change_tracking_gate,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import {
  discard_rejected_change,
  discard_remotely_deleted_change,
  list_rejected_changes,
  requeue_conflicted_entries,
  requeue_rejected_change,
  restore_remotely_deleted_change,
} from "./syncOutboxReview";
import { build_entry } from "./syncPushService.test_support";
import type { ConvexClient } from "./syncTypes";

type FakeSyncDatabase = ReturnType<typeof create_fake_sync_database>;

interface ReviewHarness {
  fake: FakeSyncDatabase;
  dependencies: {
    database: FakeSyncDatabase["database"];
    gate: ChangeTrackingGate;
  };
}

function create_review(entries: Record<string, unknown>[]): ReviewHarness {
  const fake = create_fake_sync_database();
  fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
  fake.seed("sync_outbox", entries);
  return {
    fake,
    dependencies: {
      database: fake.database,
      gate: create_change_tracking_gate(),
    },
  };
}

const CONFLICTED = build_entry({ status: "conflicted", remote_version: 6 });
const REJECTED = build_entry({
  status: "rejected",
  rejection_code: "rejected_wrong_organization",
  rejection_message: "Record organization does not match caller organization",
});

describe("sync outbox review", () => {
  it("requeues conflicted entries so the next push re-detects them with fresh server data", async () => {
    const { fake, dependencies } = create_review([CONFLICTED]);

    expect(await requeue_conflicted_entries(dependencies.database)).toBe(1);

    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "pending",
      base_version: { kind: "known", version: 4 },
    });
  });

  it("lists rejected changes with their friendly messages", async () => {
    const { dependencies } = create_review([REJECTED]);

    expect(await list_rejected_changes(dependencies.database)).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        rejection_code: "rejected_wrong_organization",
        rejection_message:
          "Record organization does not match caller organization",
      },
    ]);
  });

  it("restores a remotely deleted record by re-pushing it as an explicit re-create", async () => {
    const { fake, dependencies } = create_review([CONFLICTED]);

    const result = await restore_remotely_deleted_change(
      dependencies.database,
      "teams",
      "team_a",
    );

    expect(result.success).toBe(true);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "pending",
      base_version: { kind: "recreate" },
      change_token: "token_1",
    });
  });

  it("discards local changes to a remotely deleted record by deleting it locally", async () => {
    const { fake, dependencies } = create_review([CONFLICTED]);
    fake.seed("sync_record_versions", [
      { table_name: "teams", local_id: "team_a", server_version: 4 },
    ]);

    const result = await discard_remotely_deleted_change(
      dependencies,
      "teams",
      "team_a",
    );

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        server_version: 6,
        server_sequence: 0,
        record_state: "deleted",
      },
    ]);
  });

  it("requeues a rejected change for another attempt", async () => {
    const { fake, dependencies } = create_review([REJECTED]);

    const requeue_result = await requeue_rejected_change(
      dependencies.database,
      "teams",
      "team_a",
    );

    expect(requeue_result.success).toBe(true);

    expect(fake.rows("sync_outbox")[0]).toEqual(
      build_entry({ status: "pending" }),
    );
  });

  it("discards a rejected change by restoring the server copy", async () => {
    const { fake, dependencies } = create_review([REJECTED]);
    const convex_client = {
      query: vi.fn().mockResolvedValue({
        status: "found",
        record: { local_id: "team_a", name: "Server", version: 7 },
      }),
      mutation: vi.fn(),
    } as unknown as ConvexClient;

    const result = await discard_rejected_change(
      { ...dependencies, convex_client },
      "teams",
      "team_a",
    );

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Server" }]);
    expect(fake.rows("sync_outbox")).toEqual([]);
  });

  it("discards a rejected new record by removing it when the server never had it", async () => {
    const { fake, dependencies } = create_review([
      { ...REJECTED, base_version: { kind: "unknown" } },
    ]);
    const convex_client = {
      query: vi.fn().mockResolvedValue({ status: "not_found" }),
      mutation: vi.fn(),
    } as unknown as ConvexClient;

    const discard_result = await discard_rejected_change(
      { ...dependencies, convex_client },
      "teams",
      "team_a",
    );

    expect(discard_result.success).toBe(true);

    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([]);
  });

  it("keeps the rejected change when the server copy cannot be loaded", async () => {
    const { fake, dependencies } = create_review([REJECTED]);
    const convex_client = {
      query: vi.fn().mockRejectedValue(new Error("offline")),
      mutation: vi.fn(),
    } as unknown as ConvexClient;

    const result = await discard_rejected_change(
      { ...dependencies, convex_client },
      "teams",
      "team_a",
    );

    expect(result.success).toBe(false);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
    expect(fake.rows("sync_outbox")).toHaveLength(1);
  });
});
