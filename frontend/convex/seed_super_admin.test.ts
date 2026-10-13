import { describe, expect, it } from "vitest";

import { seed_super_admin } from "./authorization_mutations";
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
import { SecurityEventType } from "./lib/security_event_types";
import {
  ALL_FIXTURE_USERS,
  GLOBAL_SCOPE_ID,
  ORGANIZATION_A_ADMIN_EMAIL,
  STRANGER_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";

type MutationResult = { success: boolean; error?: string };

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

describe("seed_super_admin bootstrap gating", () => {
  const users_without_super_admin = ALL_FIXTURE_USERS.filter(
    (user) => user.role !== "super_admin",
  );

  it("rejects anonymous callers even during bootstrap", async () => {
    const context = create_context(
      ANONYMOUS_IDENTITY,
      users_without_super_admin,
    );
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: STRANGER_EMAIL },
    );
    expect(result.success).toBe(false);
    expect(find_user(context, STRANGER_EMAIL)).toEqual({});
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.SEED_ADMIN_BLOCKED,
    );
  });

  it("lets an authenticated caller claim super admin for themselves during bootstrap", async () => {
    const context = create_context(authenticated_identity(STRANGER_EMAIL), []);
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: STRANGER_EMAIL },
    );
    expect(result.success).toBe(true);
    expect(find_user(context, STRANGER_EMAIL)).toMatchObject({
      role: "super_admin",
      organization_id: GLOBAL_SCOPE_ID,
    });
  });

  it("blocks bootstrap seeding of an email other than the caller's", async () => {
    const context = create_context(authenticated_identity(STRANGER_EMAIL), []);
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: "victim@example.com" },
    );
    expect(result.success).toBe(false);
  });

  it("blocks non super admins once bootstrap is complete", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    );
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: ORGANIZATION_A_ADMIN_EMAIL },
    );
    expect(result.success).toBe(false);
    expect(find_user(context, ORGANIZATION_A_ADMIN_EMAIL)?.role).toBe(
      "org_admin",
    );
  });

  it("lets an existing super admin seed another super admin", async () => {
    const context = create_context(authenticated_identity(SUPER_ADMIN_EMAIL));
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: STRANGER_EMAIL },
    );
    expect(result.success).toBe(true);
    expect(find_user(context, STRANGER_EMAIL)?.role).toBe("super_admin");
  });

  it("rejects a self-registered caller when users exist but no super admin is active", async () => {
    const context = create_context(
      authenticated_identity(STRANGER_EMAIL),
      users_without_super_admin,
    );
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: STRANGER_EMAIL },
    );
    expect(result.success).toBe(false);
    expect(find_user(context, STRANGER_EMAIL)).toEqual({});
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.SEED_ADMIN_BLOCKED,
    );
  });

  it("rejects a registered user claiming super admin when only inactive super admins exist", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      ALL_FIXTURE_USERS.map((user) =>
        user.role === "super_admin" ? { ...user, status: "inactive" } : user,
      ),
    );
    const result = await invoke_convex_handler<MutationResult>(
      seed_super_admin,
      context,
      { email: ORGANIZATION_A_ADMIN_EMAIL },
    );
    expect(result.success).toBe(false);
    expect(find_user(context, ORGANIZATION_A_ADMIN_EMAIL)?.role).toBe(
      "org_admin",
    );
  });
});
