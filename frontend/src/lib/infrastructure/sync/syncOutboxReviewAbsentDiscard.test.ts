import { describe, expect, it, vi } from "vitest";

import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  create_fake_sync_database,
  type FakeSyncDatabase,
} from "./syncFakeDatabase.test_support";
import { discard_rejected_change } from "./syncOutboxReview";
import { build_entry } from "./syncPushService.test_support";
import type { ConvexClient } from "./syncTypes";

function seed_parked_change(): FakeSyncDatabase {
  const fake = create_fake_sync_database();
  fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
  fake.seed("sync_outbox", [
    build_entry({
      status: "rejected",
      rejection_code: "rejected_permission_denied",
      rejection_message: "Not allowed",
    }),
  ]);
  fake.seed("sync_record_versions", [
    {
      table_name: "teams",
      local_id: "team_a",
      server_version: 4,
      server_sequence: 0,
      record_state: "live",
    },
  ]);
  return fake;
}

function client_reporting(lookup: unknown): ConvexClient {
  return {
    query: vi.fn().mockResolvedValue(lookup),
    mutation: vi.fn(),
  } as unknown as ConvexClient;
}

async function discard_with(
  fake: FakeSyncDatabase,
  lookup: unknown,
): Promise<boolean> {
  const result = await discard_rejected_change(
    {
      database: fake.database,
      gate: create_change_tracking_gate(),
      convex_client: client_reporting(lookup),
    },
    "teams",
    "team_a",
  );
  return result.success;
}

describe("discard_rejected_change when the server copy is gone", () => {
  it("drops the local copy and keeps a tombstone when the server deleted the record", async () => {
    const fake = seed_parked_change();

    expect(
      await discard_with(fake, {
        status: "not_found",
        reason: "deleted",
        tombstone_version: 9,
      }),
    ).toBe(true);

    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        server_version: 9,
        server_sequence: 0,
        record_state: "deleted",
      },
    ]);
  });

  it("drops the local copy and forgets its version when the account can no longer see it", async () => {
    const fake = seed_parked_change();

    expect(
      await discard_with(fake, { status: "not_found", reason: "not_visible" }),
    ).toBe(true);

    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([]);
  });

  it("drops a previously synced local copy the server reports never existed", async () => {
    const fake = seed_parked_change();

    expect(
      await discard_with(fake, {
        status: "not_found",
        reason: "never_existed",
      }),
    ).toBe(true);

    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([]);
  });

  it("keeps a change that was edited again while the lookup ran", async () => {
    const fake = seed_parked_change();
    const client = {
      query: async (): Promise<unknown> => {
        fake.seed("sync_outbox", [build_entry({ change_token: "token_9" })]);
        return { status: "not_found", reason: "deleted", tombstone_version: 9 };
      },
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
  });
});
