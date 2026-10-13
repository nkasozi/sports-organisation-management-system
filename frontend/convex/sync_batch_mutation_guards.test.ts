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
  GLOBAL_SCOPE_ID,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
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

describe("batch_upsert tenant isolation and privilege guards", () => {
  it("blocks the system_users super admin escalation via a global org id", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_admin_a",
          data: {
            email: ORGANIZATION_A_ADMIN_EMAIL,
            role: "super_admin",
            organization_id: GLOBAL_SCOPE_ID,
          },
          version: 9,
        },
      ],
    );
    expect(result.results[0].success).toBe(false);
    const stored_user = find_user(context, ORGANIZATION_A_ADMIN_EMAIL);
    expect(stored_user?.role).toBe("org_admin");
    expect(stored_user?.organization_id).toBe(ORGANIZATION_A_ID);
  });

  it("blocks self role escalation even within the caller's organization", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_admin_a",
          data: {
            email: ORGANIZATION_A_ADMIN_EMAIL,
            role: "super_admin",
            organization_id: ORGANIZATION_A_ID,
          },
          version: 9,
        },
      ],
    );
    expect(result.results[0]).toMatchObject({
      success: false,
      action: "rejected_privilege_change",
    });
    expect(find_user(context, ORGANIZATION_A_ADMIN_EMAIL)?.role).toBe(
      "org_admin",
    );
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ROLE_ESCALATION_BLOCKED,
    );
  });

  it("denies roles without system user permissions outright", async () => {
    const { result } = await run_batch(
      ORGANIZATION_A_PLAYER_EMAIL,
      "system_users",
      [
        {
          local_id: "user_player_a",
          data: { email: ORGANIZATION_A_PLAYER_EMAIL, role: "org_admin" },
          version: 9,
        },
      ],
    );
    expect(result.success).toBe(false);
  });

  it("blocks creating a user with a role at or above the caller", async () => {
    const { context, result } = await run_batch(
      ORGANIZATION_A_ADMIN_EMAIL,
      "system_users",
      [
        {
          local_id: "user_new_admin",
          data: {
            email: "peer@example.com",
            role: "org_admin",
            organization_id: ORGANIZATION_A_ID,
          },
          version: 1,
        },
      ],
    );
    expect(result.results[0].success).toBe(false);
    expect(find_user(context, "peer@example.com")).toEqual({});
  });
});
