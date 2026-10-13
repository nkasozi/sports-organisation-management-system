import { describe, expect, it } from "vitest";

import { seed_admin_user } from "./admin_seed";
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

type SeedResult = { success: boolean; action?: string; error?: string };

const ROGUE_GLOBAL_ORG_ADMIN = {
  local_id: "user_rogue",
  email: "rogue@example.com",
  role: "org_admin",
  organization_id: GLOBAL_SCOPE_ID,
  status: "active",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

async function seed_as(
  identity: FakeIdentity,
  system_users: Record<string, unknown>[],
  email: string,
): Promise<{ context: FakeConvexContext; result: SeedResult }> {
  const context = create_fake_convex_context({
    identity,
    tables: { system_users },
  });
  const result = await invoke_convex_handler<SeedResult>(
    seed_admin_user,
    context,
    { email },
  );
  return { context, result };
}

function find_user(
  context: ReturnType<typeof create_fake_convex_context>,
  email: string,
): Record<string, unknown> {
  return (
    find_table_rows(context, "system_users").find(
      (row) => row.email === email,
    ) ?? {}
  );
}

describe("seed_admin_user", () => {
  it("rejects anonymous callers", async () => {
    const { context, result } = await seed_as(
      ANONYMOUS_IDENTITY,
      [],
      STRANGER_EMAIL,
    );
    expect(result.success).toBe(false);
    expect(find_user(context, STRANGER_EMAIL)).toEqual({});
  });

  it("lets the first authenticated caller bootstrap themselves", async () => {
    const { context, result } = await seed_as(
      authenticated_identity(STRANGER_EMAIL),
      [],
      STRANGER_EMAIL,
    );
    expect(result).toMatchObject({ success: true, action: "created" });
    expect(find_user(context, STRANGER_EMAIL)).toMatchObject({
      role: "super_admin",
      organization_id: GLOBAL_SCOPE_ID,
    });
  });

  it("lets an existing super admin seed another admin", async () => {
    const { context, result } = await seed_as(
      authenticated_identity(SUPER_ADMIN_EMAIL),
      ALL_FIXTURE_USERS,
      STRANGER_EMAIL,
    );
    expect(result.success).toBe(true);
    expect(find_user(context, STRANGER_EMAIL)?.role).toBe("super_admin");
  });

  it("blocks org admins after bootstrap", async () => {
    const { context, result } = await seed_as(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      ALL_FIXTURE_USERS,
      ORGANIZATION_A_ADMIN_EMAIL,
    );
    expect(result.success).toBe(false);
    expect(find_user(context, ORGANIZATION_A_ADMIN_EMAIL)?.role).toBe(
      "org_admin",
    );
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.SEED_ADMIN_BLOCKED,
    );
  });

  it("blocks non super admins that merely carry the global organization id", async () => {
    const { context, result } = await seed_as(
      authenticated_identity(ROGUE_GLOBAL_ORG_ADMIN.email),
      [...ALL_FIXTURE_USERS, ROGUE_GLOBAL_ORG_ADMIN],
      ROGUE_GLOBAL_ORG_ADMIN.email,
    );
    expect(result.success).toBe(false);
    expect(find_user(context, ROGUE_GLOBAL_ORG_ADMIN.email)?.role).toBe(
      "org_admin",
    );
  });

  it("blocks bootstrap seeding of an email other than the caller's", async () => {
    const { result } = await seed_as(
      authenticated_identity(STRANGER_EMAIL),
      [],
      "victim@example.com",
    );
    expect(result.success).toBe(false);
  });

  it("blocks bootstrap claims once any system user exists without an active super admin", async () => {
    const { context, result } = await seed_as(
      authenticated_identity(STRANGER_EMAIL),
      ALL_FIXTURE_USERS.filter((user) => user.role !== "super_admin"),
      STRANGER_EMAIL,
    );
    expect(result.success).toBe(false);
    expect(find_user(context, STRANGER_EMAIL)).toEqual({});
  });
});
