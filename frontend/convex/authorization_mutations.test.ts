import { describe, expect, it } from "vitest";

import { update_user_role } from "./authorization_mutations";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  type FakeIdentity,
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
  ORGANIZATION_B_ADMIN_EMAIL,
  ORGANIZATION_B_ID,
  SECOND_SUPER_ADMIN_USER,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";

type MutationResult = { success: boolean; error?: string };

const LEGACY_GLOBAL_ORG_ADMIN = {
  local_id: "user_legacy_global_admin",
  email: "legacy.global@example.com",
  role: "org_admin",
  organization_id: GLOBAL_SCOPE_ID,
  status: "active",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

function create_context(
  identity: FakeIdentity,
  system_users: Record<string, unknown>[] = ALL_FIXTURE_USERS,
): FakeConvexContext {
  return create_fake_convex_context({ identity, tables: { system_users } });
}

function find_user(
  context: ReturnType<typeof create_context>,
  email: string,
): Record<string, unknown> {
  return (
    find_table_rows(context, "system_users").find(
      (row) => row.email === email,
    ) ?? {}
  );
}

function find_blocked_details(
  context: ReturnType<typeof create_context>,
): string[] {
  return context.scheduled_calls.map((scheduled_call) =>
    String(scheduled_call.function_arguments.details),
  );
}

async function change_role(
  caller_email: string,
  command: Record<string, unknown>,
): Promise<{ context: FakeConvexContext; result: MutationResult }> {
  const context = create_context(authenticated_identity(caller_email));
  const result = await invoke_convex_handler<MutationResult>(
    update_user_role,
    context,
    command,
  );
  return { context, result };
}

describe("update_user_role characterization", () => {
  it("lets an org admin change a lower-privileged user in their org", async () => {
    const { context, result } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      target_email: ORGANIZATION_A_PLAYER_EMAIL,
      role: "team_manager",
    });
    expect(result.success).toBe(true);
    expect(find_user(context, ORGANIZATION_A_PLAYER_EMAIL)?.role).toBe(
      "team_manager",
    );
  });

  it("blocks assigning a role at or above the caller", async () => {
    const { result } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      target_email: ORGANIZATION_A_PLAYER_EMAIL,
      role: "super_admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("update_user_role hierarchy and tenant guards", () => {
  it("blocks an org admin from demoting a super admin", async () => {
    const { context, result } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      target_email: SUPER_ADMIN_EMAIL,
      role: "player",
    });
    expect(result.success).toBe(false);
    expect(find_user(context, SUPER_ADMIN_EMAIL)?.role).toBe("super_admin");
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ROLE_ESCALATION_BLOCKED,
    );
  });

  it("blocks an org admin from editing users in another organization", async () => {
    const { context, result } = await change_role(ORGANIZATION_B_ADMIN_EMAIL, {
      target_email: ORGANIZATION_A_PLAYER_EMAIL,
      role: "team_manager",
    });
    expect(result.success).toBe(false);
    expect(find_user(context, ORGANIZATION_A_PLAYER_EMAIL)?.role).toBe(
      "player",
    );
  });

  it("blocks an org admin from moving a user to the global scope", async () => {
    const { context, result } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      target_email: ORGANIZATION_A_PLAYER_EMAIL,
      role: "team_manager",
      organization_id: GLOBAL_SCOPE_ID,
    });
    expect(result.success).toBe(false);
    expect(
      find_user(context, ORGANIZATION_A_PLAYER_EMAIL)?.organization_id,
    ).toBe(ORGANIZATION_A_ID);
  });

  it("blocks an org admin from moving a user to another organization", async () => {
    const { result } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      target_email: ORGANIZATION_A_PLAYER_EMAIL,
      role: "team_manager",
      organization_id: ORGANIZATION_B_ID,
    });
    expect(result.success).toBe(false);
  });

  it("blocks a super admin from changing their own privileges", async () => {
    const { context, result } = await change_role(SUPER_ADMIN_EMAIL, {
      target_email: SUPER_ADMIN_EMAIL,
      role: "org_admin",
    });
    expect(result.success).toBe(false);
    expect(find_user(context, SUPER_ADMIN_EMAIL)?.role).toBe("super_admin");
    expect(find_blocked_details(context)).toContainEqual(
      expect.stringContaining("self_privilege_change"),
    );
  });

  it("blocks a legacy global-scope org admin from demoting a super admin", async () => {
    const context = create_context(
      authenticated_identity(LEGACY_GLOBAL_ORG_ADMIN.email),
      [...ALL_FIXTURE_USERS, LEGACY_GLOBAL_ORG_ADMIN],
    );
    const result = await invoke_convex_handler<MutationResult>(
      update_user_role,
      context,
      {
        target_email: SUPER_ADMIN_EMAIL,
        role: "player",
        organization_id: ORGANIZATION_A_ID,
      },
    );
    expect(result.success).toBe(false);
    expect(find_user(context, SUPER_ADMIN_EMAIL)?.role).toBe("super_admin");
    expect(find_blocked_details(context)).toContainEqual(
      expect.stringContaining("target_not_below_caller"),
    );
  });

  it("lets a super admin demote another super admin when one remains", async () => {
    const context = create_context(authenticated_identity(SUPER_ADMIN_EMAIL), [
      ...ALL_FIXTURE_USERS,
      SECOND_SUPER_ADMIN_USER,
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      update_user_role,
      context,
      {
        target_email: SECOND_SUPER_ADMIN_USER.email,
        role: "org_admin",
        organization_id: ORGANIZATION_A_ID,
      },
    );
    expect(result.success).toBe(true);
    expect(find_user(context, SECOND_SUPER_ADMIN_USER.email)).toMatchObject({
      role: "org_admin",
      organization_id: ORGANIZATION_A_ID,
    });
  });
});
