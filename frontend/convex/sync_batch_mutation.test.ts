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
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

interface BatchResult {
  success: boolean;
  results: Array<{ local_id: string; success: boolean; action: string }>;
  has_conflicts: boolean;
}

function create_context_for(
  email: string,
  teams: Record<string, unknown>[] = [],
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: { system_users: ALL_FIXTURE_USERS, teams },
  });
}

async function run_batch(
  email: string,
  table_name: string,
  records: Array<{ local_id: string; data: unknown; version: number }>,
  teams: Record<string, unknown>[] = [],
): Promise<{ context: FakeConvexContext; result: BatchResult }> {
  const context = create_context_for(email, teams);
  const result = await invoke_convex_handler<BatchResult>(
    batch_upsert,
    context,
    { table_name, records },
  );
  return { context, result };
}

function find_user(
  context: ReturnType<typeof create_context_for>,
  email: string,
): Record<string, unknown> {
  return (
    find_table_rows(context, "system_users").find(
      (row) => row.email === email,
    ) ?? {}
  );
}

describe("batch_upsert characterization", () => {
  it("creates and skips records based on version", async () => {
    const { result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "teams",
      [
        {
          local_id: "team_new",
          data: build_team_record("team_new", ORGANIZATION_A_ID, 1),
          version: 1,
        },
        {
          local_id: "team_old",
          data: build_team_record("team_old", ORGANIZATION_A_ID, 1),
          version: 1,
        },
      ],
      [build_team_record("team_old", ORGANIZATION_A_ID, 4)],
    );
    expect(result.results.map((entry) => entry.action)).toEqual([
      "created",
      "skipped",
    ]);
  });

  it("rejects batches above the size limit before processing", async () => {
    const records = Array.from({ length: 51 }, (_, index) => ({
      local_id: `team_${index}`,
      data: {},
      version: 1,
    }));
    const { result } = await run_batch(SUPER_ADMIN_EMAIL, "teams", records);
    expect(result.success).toBe(false);
  });

  it("lets an org admin create a lower-privileged user in their org", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_new_manager",
          data: {
            email: "new.manager@example.com",
            role: "team_manager",
            organization_id: ORGANIZATION_A_ID,
          },
          version: 1,
        },
      ],
    );
    expect(result.results[0].action).toBe("created");
    expect(find_user(context, "new.manager@example.com")?.role).toBe(
      "team_manager",
    );
  });
});
