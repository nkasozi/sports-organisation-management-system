import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

interface VersionedBatchResult {
  success: boolean;
  results: Array<{
    local_id: string;
    success: boolean;
    action: string;
    server_version: number;
  }>;
  conflicts: Array<{ local_id: string; remote_version: number }>;
}

function create_context(
  teams: Record<string, unknown>[],
  sync_tombstones: Record<string, unknown>[] = [],
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, teams, sync_tombstones },
  });
}

async function push_records(
  context: ReturnType<typeof create_context>,
  records: Array<Record<string, unknown>>,
): Promise<VersionedBatchResult> {
  return invoke_convex_handler<VersionedBatchResult>(batch_upsert, context, {
    table_name: "teams",
    records,
  });
}

function team_with_name(
  local_id: string,
  name: string,
  version: number,
): Record<string, unknown> {
  return { ...build_team_record(local_id, ORGANIZATION_A_ID, version), name };
}

describe("batch_upsert optimistic concurrency", () => {
  it("applies a write whose base version matches and assigns the next server version", async () => {
    const context = create_context([team_with_name("team_a", "Lions", 4)]);
    const result = await push_records(context, [
      {
        local_id: "team_a",
        data: team_with_name("team_a", "Tigers", 999),
        version: 999,
        base_version: { kind: "known", version: 4 },
      },
    ]);
    const stored_team = find_table_rows(context, "teams")[0];
    expect(result.results[0]).toMatchObject({
      action: "updated",
      server_version: 5,
    });
    expect(stored_team).toMatchObject({
      name: "Tigers",
      version: 5,
      sync_sequence: 1,
    });
  });

  it("returns a conflict with the server copy when the base version is stale", async () => {
    const context = create_context([team_with_name("team_a", "Lions", 4)]);
    const result = await push_records(context, [
      {
        local_id: "team_a",
        data: team_with_name("team_a", "Tigers", 3),
        version: 3,
        base_version: { kind: "known", version: 3 },
      },
    ]);
    expect(result.results[0].action).toBe("conflict_detected");
    expect(result.conflicts[0]).toMatchObject({
      local_id: "team_a",
      remote_version: 4,
    });
    expect(find_table_rows(context, "teams")[0].name).toBe("Lions");
  });

  it("acknowledges identical data without writing and reports the current version", async () => {
    const context = create_context([team_with_name("team_a", "Lions", 4)]);
    const result = await push_records(context, [
      {
        local_id: "team_a",
        data: team_with_name("team_a", "Lions", 1),
        version: 1,
        base_version: { kind: "unknown" },
      },
    ]);
    expect(result.results[0]).toMatchObject({
      action: "skipped",
      server_version: 4,
    });
    expect(find_table_rows(context, "sync_change_sequences")).toHaveLength(0);
  });

  it("re-creates a deleted record above its tombstone on explicit re-create and clears the tombstone", async () => {
    const context = create_context(
      [],
      [
        {
          table_name: "teams",
          local_id: "team_a",
          version: 6,
          sync_sequence: 3,
          deleted_at: "2024-01-01T00:00:00.000Z",
          scope: { organization_id: ORGANIZATION_A_ID },
        },
      ],
    );
    const result = await push_records(context, [
      {
        local_id: "team_a",
        data: team_with_name("team_a", "Lions", 1),
        version: 1,
        base_version: { kind: "recreate" },
      },
    ]);
    expect(result.results[0]).toMatchObject({
      action: "created",
      server_version: 7,
    });
    expect(find_table_rows(context, "sync_tombstones")).toHaveLength(0);
  });

  it("assigns strictly increasing change sequences within a batch", async () => {
    const context = create_context([]);
    await push_records(context, [
      {
        local_id: "team_a",
        data: team_with_name("team_a", "A", 1),
        version: 1,
        base_version: { kind: "unknown" },
      },
      {
        local_id: "team_b",
        data: team_with_name("team_b", "B", 1),
        version: 1,
        base_version: { kind: "unknown" },
      },
    ]);
    expect(
      find_table_rows(context, "teams").map((row) => row.sync_sequence),
    ).toEqual([1, 2]);
  });
});
