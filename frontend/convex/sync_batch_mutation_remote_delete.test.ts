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

interface RemoteDeleteBatchResult {
  success: boolean;
  results: Array<{ local_id: string; action: string; server_version: number }>;
  conflicts: Array<Record<string, unknown>>;
  deleted_remotely: Array<Record<string, unknown>>;
}

const DELETED_AT = "2024-01-01T00:00:00.000Z";

function team_tombstone(version: number): Record<string, unknown> {
  return {
    table_name: "teams",
    local_id: "team_a",
    version,
    sync_sequence: 3,
    deleted_at: DELETED_AT,
    scope: { local_id: "team_a", organization_id: ORGANIZATION_A_ID },
  };
}

function create_context(
  teams: Array<Record<string, unknown>>,
  sync_tombstones: Array<Record<string, unknown>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, teams, sync_tombstones },
  });
}

async function push_team(
  context: ReturnType<typeof create_context>,
  base_version: Record<string, unknown>,
): Promise<RemoteDeleteBatchResult> {
  return invoke_convex_handler<RemoteDeleteBatchResult>(batch_upsert, context, {
    table_name: "teams",
    records: [
      {
        local_id: "team_a",
        data: { ...build_team_record("team_a", ORGANIZATION_A_ID, 5) },
        version: 5,
        base_version,
      },
    ],
  });
}

describe("batch_upsert after a remote delete", () => {
  it.each([
    ["known", { kind: "known", version: 5 }],
    ["unknown", { kind: "unknown" }],
  ])(
    "reports deleted_remotely for a %s base instead of resurrecting the record",
    async (_label, base_version) => {
      const context = create_context([], [team_tombstone(6)]);
      const result = await push_team(context, base_version);
      expect(result.results[0]).toEqual({
        local_id: "team_a",
        success: true,
        action: "deleted_remotely",
        server_version: 6,
      });
      expect(result.deleted_remotely).toEqual([
        {
          local_id: "team_a",
          local_version: 5,
          tombstone_version: 6,
          deleted_at: DELETED_AT,
        },
      ]);
      expect(result.conflicts).toEqual([]);
      expect(find_table_rows(context, "teams")).toEqual([]);
      expect(find_table_rows(context, "sync_tombstones")).toHaveLength(1);
    },
  );

  it("still inserts a record that never existed", async () => {
    const context = create_context([], []);
    const result = await push_team(context, { kind: "unknown" });
    expect(result.results[0].action).toBe("created");
    expect(result.deleted_remotely).toEqual([]);
  });

  it("reports a remote deletion instead of resurrecting a record whose tombstone was pruned", async () => {
    const context = create_context([], []);
    const result = await push_team(context, { kind: "known", version: 5 });
    expect(result.results[0].action).toBe("deleted_remotely");
    expect(find_table_rows(context, "teams")).toEqual([]);
  });
});

describe("batch_upsert conflict payload", () => {
  it("describes the remote author with an explicit known or unknown union", async () => {
    const context = create_context(
      [
        {
          ...build_team_record("team_a", ORGANIZATION_A_ID, 9),
          name: "Remote",
          updated_by: "user_remote",
        },
        { ...build_team_record("team_b", ORGANIZATION_A_ID, 9), name: "B" },
      ],
      [],
    );
    const result = await invoke_convex_handler<RemoteDeleteBatchResult>(
      batch_upsert,
      context,
      {
        table_name: "teams",
        records: ["team_a", "team_b"].map((local_id) => ({
          local_id,
          data: { ...build_team_record(local_id, ORGANIZATION_A_ID, 1) },
          version: 1,
          base_version: { kind: "known", version: 1 },
        })),
      },
    );
    expect(result.results.map((row) => row.action)).toEqual([
      "conflict_detected",
      "conflict_detected",
    ]);
    expect(result.conflicts.map((row) => row.remote_updated_by)).toEqual([
      { kind: "known", updated_by: "user_remote" },
      { kind: "unknown" },
    ]);
  });
});
