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
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import { delete_record } from "./sync_basic_mutations";
import { batch_delete } from "./sync_batch_delete_mutation";

interface BatchDeleteResponse {
  success: boolean;
  results: Array<{ local_id: string; success: boolean; action: string }>;
  conflicts: Array<{ local_id: string; remote_version: number }>;
}

function create_context(teams: Record<string, unknown>[]): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, teams },
  });
}

async function run_batch_delete(
  context: ReturnType<typeof create_context>,
  records: Array<Record<string, unknown>>,
): Promise<BatchDeleteResponse> {
  return invoke_convex_handler<BatchDeleteResponse>(batch_delete, context, {
    table_name: "teams",
    records,
  });
}

describe("batch_delete", () => {
  it("deletes the record and leaves a scoped tombstone with the next version", async () => {
    const context = create_context([
      build_team_record("team_a", ORGANIZATION_A_ID, 3),
    ]);
    const response = await run_batch_delete(context, [
      { local_id: "team_a", base_version: { kind: "known", version: 3 } },
    ]);
    expect(response.results[0]).toMatchObject({ action: "deleted" });
    expect(find_table_rows(context, "teams")).toHaveLength(0);
    expect(find_table_rows(context, "sync_tombstones")[0]).toMatchObject({
      table_name: "teams",
      local_id: "team_a",
      version: 4,
      sync_sequence: 1,
      scope: { local_id: "team_a", organization_id: ORGANIZATION_A_ID },
    });
  });

  it("refuses to delete a record that changed remotely since the base version", async () => {
    const context = create_context([
      build_team_record("team_a", ORGANIZATION_A_ID, 5),
    ]);
    const response = await run_batch_delete(context, [
      { local_id: "team_a", base_version: { kind: "known", version: 3 } },
    ]);
    expect(response.results[0].action).toBe("conflict_detected");
    expect(response.conflicts[0]).toMatchObject({
      local_id: "team_a",
      remote_version: 5,
    });
    expect(find_table_rows(context, "teams")).toHaveLength(1);
  });

  it("treats deleting an absent record as an idempotent success", async () => {
    const context = create_context([]);
    const response = await run_batch_delete(context, [
      { local_id: "missing", base_version: { kind: "unknown" } },
    ]);
    expect(response.results[0]).toMatchObject({
      success: true,
      action: "not_found",
    });
  });

  it("keeps tenant isolation for deletes", async () => {
    const context = create_context([
      build_team_record("team_b", ORGANIZATION_B_ID, 1),
    ]);
    const response = await run_batch_delete(context, [
      { local_id: "team_b", base_version: { kind: "unknown" } },
    ]);
    expect(response.results[0].success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(1);
    expect(find_table_rows(context, "sync_tombstones")).toHaveLength(0);
  });

  it("rejects oversized batches before processing", async () => {
    const context = create_context([]);
    const records = Array.from({ length: 51 }, (_, index) => ({
      local_id: `team_${index}`,
      base_version: { kind: "unknown" },
    }));
    const response = await run_batch_delete(context, records);
    expect(response.success).toBe(false);
  });
});

describe("delete_record tombstones", () => {
  it("writes a tombstone for legacy single-record deletes", async () => {
    const context = create_context([
      build_team_record("team_a", ORGANIZATION_A_ID, 2),
    ]);
    await invoke_convex_handler(delete_record, context, {
      table_name: "teams",
      local_id: "team_a",
    });
    expect(find_table_rows(context, "sync_tombstones")).toHaveLength(1);
  });
});
