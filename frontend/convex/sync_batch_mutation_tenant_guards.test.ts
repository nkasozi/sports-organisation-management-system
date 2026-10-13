import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  get_scheduled_event_types,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import { SecurityEventType } from "./lib/security_event_types";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
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

describe("batch_upsert tenant guards", () => {
  it("blocks demoting a super admin through sync", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_root",
          data: {
            email: SUPER_ADMIN_EMAIL,
            role: "player",
            organization_id: ORGANIZATION_A_ID,
          },
          version: 9,
        },
      ],
    );
    expect(result.results[0].success).toBe(false);
    expect(find_user(context, SUPER_ADMIN_EMAIL)?.role).toBe("super_admin");
  });

  it("blocks creating a duplicate account for an existing email", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_shadow_root",
          data: {
            email: SUPER_ADMIN_EMAIL,
            role: "player",
            organization_id: ORGANIZATION_A_ID,
          },
          version: 1,
        },
      ],
    );
    expect(result.results[0].success).toBe(false);
    expect(
      find_table_rows(context, "system_users").filter(
        (row) => row.email === SUPER_ADMIN_EMAIL,
      ),
    ).toHaveLength(1);
  });

  it("blocks hijacking another organization's record by local_id", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "teams",
      [
        {
          local_id: "team_b",
          data: build_team_record("team_b", ORGANIZATION_A_ID, 7),
          version: 7,
        },
      ],
      [build_team_record("team_b", ORGANIZATION_B_ID, 1)],
    );
    expect(result.results[0]).toMatchObject({
      success: false,
      action: "rejected_wrong_organization",
    });
    expect(find_table_rows(context, "teams")[0].organization_id).toBe(
      ORGANIZATION_B_ID,
    );
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ORG_SCOPE_VIOLATION,
    );
  });
});
