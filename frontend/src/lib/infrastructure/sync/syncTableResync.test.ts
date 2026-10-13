import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  invoke_convex_handler,
} from "$convex/lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "$convex/lib/security_test_fixtures.test_support";
import { SYNC_TOMBSTONE_RETENTION_DAYS } from "$convex/lib/sync_tombstone_retention";
import { get_changes_page } from "$convex/sync_change_queries";
import { prune_expired_tombstones_batch } from "$convex/sync_tombstone_pruning";
import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  create_fake_sync_database,
  type FakeSyncDatabase,
} from "./syncFakeDatabase.test_support";
import { pull_table_changes_from_convex } from "./syncPullService";
import type { ConvexClient } from "./syncTypes";

const EXPIRED_DELETED_AT = "2020-01-01T00:00:00.000Z";

function create_server(): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        {
          ...build_team_record("team_live", ORGANIZATION_A_ID, 3),
          name: "Live Lions",
          sync_sequence: 12,
        },
      ],
      sync_tombstones: [
        {
          table_name: "teams",
          local_id: "team_deleted_long_ago",
          version: 2,
          sync_sequence: 9,
          deleted_at: EXPIRED_DELETED_AT,
          scope: {
            local_id: "team_deleted_long_ago",
            organization_id: ORGANIZATION_A_ID,
          },
        },
      ],
      sync_change_sequences: [{ table_name: "teams", last_sequence: 12 }],
      sync_sequence_backfill_states: [
        {
          table_name: "teams",
          status: "complete",
          backfilled_count: 1,
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  });
}

function create_client(server: FakeConvexContext): ConvexClient {
  return {
    query: (_name: string, args: Record<string, unknown>) =>
      invoke_convex_handler(get_changes_page, server, args),
    mutation: async () => ({ success: false }),
  } as unknown as ConvexClient;
}

function create_device(stale_cursor: number): FakeSyncDatabase {
  const device = create_fake_sync_database();
  device.seed("sync_cursors", [
    { table_name: "teams", after_sequence: stale_cursor },
  ]);
  device.seed("teams", [
    { id: "team_live", name: "Stale Lions" },
    { id: "team_deleted_long_ago", name: "Ghost" },
    { id: "team_pending_local", name: "Offline edit" },
  ]);
  device.seed("sync_outbox", [
    {
      table_name: "teams",
      local_id: "team_pending_local",
      operation: "upsert",
      base_version: { kind: "unknown" },
      change_token: "token_1",
      enqueued_at: "2024-01-01T00:00:00.000Z",
      status: "pending",
    },
  ]);
  return device;
}

async function pull(
  server: FakeConvexContext,
  device: FakeSyncDatabase,
): ReturnType<typeof pull_table_changes_from_convex> {
  return pull_table_changes_from_convex({
    convex_client: create_client(server),
    database: device.database,
    gate: create_change_tracking_gate(),
    table_name: "teams",
    correlation_id: "resync_run",
  });
}

describe("full table resync after tombstone pruning", () => {
  it("removes records deleted beyond the prune horizon but keeps unsynced local edits", async () => {
    const server = create_server();
    await invoke_convex_handler(prune_expired_tombstones_batch, server, {
      retention_days: SYNC_TOMBSTONE_RETENTION_DAYS,
      continuation_count: 0,
    });
    const device = create_device(4);

    const result = await pull(server, device);

    expect(result.success).toBe(true);
    expect(
      device
        .rows("teams")
        .map((row) => row.id)
        .sort(),
    ).toEqual(["team_live", "team_pending_local"]);
    expect(
      device.rows("teams").find((row) => row.id === "team_live")?.name,
    ).toBe("Live Lions");
    expect(device.rows("sync_cursors")[0].after_sequence).toBe(12);
    expect(device.rows("sync_outbox")).toHaveLength(1);
  });

  it("keeps the incremental path when the cursor is still inside the retention window", async () => {
    const server = create_server();
    const device = create_device(10);

    const result = await pull(server, device);

    expect(result.success).toBe(true);
    expect(
      device
        .rows("teams")
        .map((row) => row.id)
        .sort(),
    ).toEqual(["team_deleted_long_ago", "team_live", "team_pending_local"]);
    expect(device.rows("sync_cursors")[0].after_sequence).toBe(12);
  });
});
