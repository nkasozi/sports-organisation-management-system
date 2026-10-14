import { describe, expect, it, vi } from "vitest";

import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import { pull_table_changes_from_convex } from "./syncPullService";
import { push_table_outbox_to_convex } from "./syncPushService";
import { build_entry, create_command } from "./syncPushService.test_support";
import type { ConvexClient } from "./syncTypes";

function access_review_page(): Record<string, unknown> {
  return {
    success: true,
    status: "changes",
    error: "",
    records: [],
    tombstones: [
      {
        local_id: "team_now_hidden",
        version: 5,
        sync_sequence: 12,
        kind: "access_review",
      },
    ],
    next_cursor: 12,
    has_more: false,
  };
}

function pruned_deletion_response(): Record<string, unknown> {
  return {
    success: true,
    results: [
      {
        local_id: "team_a",
        success: true,
        action: "deleted_remotely",
        server_version: 0,
      },
    ],
    conflicts: [],
    deleted_remotely: [
      {
        local_id: "team_a",
        local_version: 4,
        tombstone_version: 0,
        deleted_at: "",
      },
    ],
  };
}

describe("tombstones from pruned deletions and access reviews", () => {
  it("removes a record this reader lost access to as a deletion", async () => {
    const fake = create_fake_sync_database();
    const query = vi.fn().mockResolvedValueOnce(access_review_page());
    const convex_client: ConvexClient = { query, mutation: vi.fn() };
    fake.seed("teams", [{ id: "team_now_hidden", name: "Hidden" }]);

    const result = await pull_table_changes_from_convex({
      convex_client,
      database: fake.database,
      gate: create_change_tracking_gate(),
      table_name: "teams",
      correlation_id: "run_1",
    });

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([]);
  });

  it("reports a deletion whose tombstone was pruned without a deletion time", async () => {
    const { fake, command } = create_command([pruned_deletion_response()]);
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.deleted_remotely).toEqual([
      expect.objectContaining({ local_id: "team_a", deleted_at: "" }),
    ]);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
  });
});
