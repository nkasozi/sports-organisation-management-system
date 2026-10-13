import { describe, expect, it, vi } from "vitest";

import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import {
  discard_rejected_change,
  discard_remotely_deleted_change,
  requeue_conflicted_entries,
} from "./syncOutboxReview";
import { build_entry } from "./syncPushService.test_support";
import type { ConvexClient } from "./syncTypes";

const NEWER_DELETE = build_entry({
  operation: "delete",
  change_token: "token_2",
  status: "pending",
});

function rejected_entry(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return build_entry({
    status: "rejected",
    rejection_code: "rejected_wrong_organization",
    rejection_message: "Record organization does not match caller organization",
    ...overrides,
  });
}

function not_found_client(): ConvexClient {
  return {
    query: vi.fn().mockResolvedValue({ status: "not_found" }),
    mutation: vi.fn(),
  } as unknown as ConvexClient;
}

describe("requeue_conflicted_entries", () => {
  it("reads and requeues conflicts inside one transaction", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry({ status: "conflicted", remote_version: 6 }),
    ]);

    expect(await requeue_conflicted_entries(fake.database)).toBe(1);

    expect(fake.transaction_markers).toHaveLength(1);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({ status: "pending" });
    expect(fake.rows("sync_outbox")[0]).not.toHaveProperty("remote_version");
  });

  it("never reverts a newer local change recorded after the conflict was read", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry({ status: "conflicted", remote_version: 6 }),
    ]);
    const original_table = fake.database.table.bind(fake.database);
    const outbox = original_table("sync_outbox");
    const original_where = outbox.where.bind(outbox);
    vi.spyOn(fake.database, "table").mockImplementation(((name: string) =>
      name === "sync_outbox"
        ? {
            ...outbox,
            where: (index: string) => ({
              equals: (value: never) => ({
                toArray: async () => {
                  const rows = await original_where(index)
                    .equals(value)
                    .toArray();
                  fake.seed("sync_outbox", [NEWER_DELETE]);
                  return rows;
                },
              }),
            }),
          }
        : original_table(name)) as never);

    await requeue_conflicted_entries(fake.database);

    expect(fake.rows("sync_outbox")).toEqual([NEWER_DELETE]);
  });
});

describe("discard_rejected_change when the server reports not found", () => {
  it("keeps a previously synced record that the server will not show", async () => {
    const fake = create_fake_sync_database();
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [rejected_entry()]);

    const result = await discard_rejected_change(
      {
        database: fake.database,
        gate: create_change_tracking_gate(),
        convex_client: not_found_client(),
      },
      "teams",
      "team_a",
    );

    expect(result.success).toBe(false);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
    expect(fake.rows("sync_outbox")).toHaveLength(1);
  });

  it("keeps a never-synced record whose change was edited while the lookup ran", async () => {
    const fake = create_fake_sync_database();
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [
      rejected_entry({ base_version: { kind: "unknown" } }),
    ]);
    const query_with_concurrent_edit = async (): Promise<unknown> => {
      fake.seed("sync_outbox", [
        build_entry({
          base_version: { kind: "unknown" },
          change_token: "token_9",
        }),
      ]);
      return { status: "not_found" };
    };
    const client = {
      query: query_with_concurrent_edit,
      mutation: vi.fn(),
    } as unknown as ConvexClient;

    const result = await discard_rejected_change(
      {
        database: fake.database,
        gate: create_change_tracking_gate(),
        convex_client: client,
      },
      "teams",
      "team_a",
    );

    expect(result.success).toBe(false);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      change_token: "token_9",
    });
  });
});

describe("discard_remotely_deleted_change", () => {
  it("keeps a tombstone at the remote deletion version", async () => {
    const fake = create_fake_sync_database();
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [
      build_entry({ status: "conflicted", remote_version: 7 }),
    ]);

    const result = await discard_remotely_deleted_change(
      { database: fake.database, gate: create_change_tracking_gate() },
      "teams",
      "team_a",
    );

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        server_version: 7,
        record_state: "deleted",
      },
    ]);
  });
});
