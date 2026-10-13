import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  type FakeIdentity,
  find_table_rows,
  get_scheduled_event_types,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_delete } from "./sync_batch_delete_mutation";

interface BatchDeleteResponse {
  success: boolean;
  results: Array<{ local_id: string; success: boolean; action: string }>;
  conflicts: Array<{ local_id: string; remote_version: number }>;
}

const TEAM_IDS = ["team_1", "team_2", "team_3"];

function create_context(identity: FakeIdentity): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: TEAM_IDS.map((local_id) =>
        build_team_record(local_id, ORGANIZATION_A_ID, 2),
      ),
    },
  });
}

async function delete_teams(
  context: ReturnType<typeof create_context>,
  base_version: Record<string, unknown>,
): Promise<BatchDeleteResponse> {
  return invoke_convex_handler<BatchDeleteResponse>(batch_delete, context, {
    table_name: "teams",
    records: TEAM_IDS.map((local_id) => ({ local_id, base_version })),
  });
}

describe("batch_delete request guards", () => {
  it("schedules one audit event for an unauthenticated request, not one per record", async () => {
    const context = create_context(ANONYMOUS_IDENTITY);
    const response = await delete_teams(context, { kind: "unknown" });
    expect(response.success).toBe(false);
    expect(response.results).toEqual([]);
    expect(get_scheduled_event_types(context)).toHaveLength(1);
    expect(find_table_rows(context, "teams")).toHaveLength(3);
  });

  it("schedules one audit event when the caller lacks delete permission", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_PLAYER_EMAIL),
    );
    const response = await delete_teams(context, { kind: "unknown" });
    expect(response.success).toBe(false);
    expect(get_scheduled_event_types(context)).toHaveLength(1);
  });
});

describe("batch_delete with an unknown base version", () => {
  it("reports a conflict instead of deleting a record that carries a server version", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    );
    const response = await delete_teams(context, { kind: "unknown" });
    expect(response.results.map((row) => row.action)).toEqual([
      "conflict_detected",
      "conflict_detected",
      "conflict_detected",
    ]);
    expect(response.conflicts[0]).toMatchObject({
      local_id: "team_1",
      remote_version: 2,
    });
    expect(find_table_rows(context, "teams")).toHaveLength(3);
  });
});
