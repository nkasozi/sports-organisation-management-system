import { describe, expect, it } from "vitest";

import { get_recent_audit_logs, search_audit_logs } from "./audit_logs";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
} from "./lib/security_test_fixtures.test_support";

const RECENT_TIMESTAMP = new Date().toISOString();

const AUDIT_LOGS = [
  {
    local_id: "log_a",
    organization_id: ORGANIZATION_A_ID,
    timestamp: RECENT_TIMESTAMP,
  },
  {
    local_id: "log_b",
    organization_id: ORGANIZATION_B_ID,
    timestamp: RECENT_TIMESTAMP,
  },
];

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: { system_users: ALL_FIXTURE_USERS, audit_logs: AUDIT_LOGS },
  });
}

async function search_as(
  email: string,
): Promise<{ success: boolean; data: Array<{ local_id: string }> }> {
  return invoke_convex_handler<{
    success: boolean;
    data: Array<{ local_id: string }>;
  }>(search_audit_logs, create_context(email), {});
}

async function recent_as(email: string): Promise<Array<{ local_id: string }>> {
  return invoke_convex_handler<Array<{ local_id: string }>>(
    get_recent_audit_logs,
    create_context(email),
    {},
  );
}

describe("audit log queries", () => {
  it("scope org admins to their own organization", async () => {
    const search_result = await search_as(ORGANIZATION_A_ADMIN_EMAIL);
    expect(search_result.data.map((log) => log.local_id)).toEqual(["log_a"]);
    const recent_logs = await recent_as(ORGANIZATION_A_ADMIN_EMAIL);
    expect(recent_logs.map((log) => log.local_id)).toEqual(["log_a"]);
  });

  it("return every log to super admins", async () => {
    expect((await search_as(SUPER_ADMIN_EMAIL)).data).toHaveLength(2);
    expect(await recent_as(SUPER_ADMIN_EMAIL)).toHaveLength(2);
  });

  it("deny callers without an organization scope", async () => {
    expect((await search_as(UNSCOPED_USER_EMAIL)).data).toEqual([]);
    expect(await recent_as(UNSCOPED_USER_EMAIL)).toEqual([]);
  });

  it("deny roles without audit log read permission", async () => {
    expect((await search_as(ORGANIZATION_A_PLAYER_EMAIL)).data).toEqual([]);
    expect(await recent_as(ORGANIZATION_A_PLAYER_EMAIL)).toEqual([]);
  });
});

describe("search_audit_logs pagination validation", () => {
  it("returns an empty failed page for invalid page requests", async () => {
    const result = await invoke_convex_handler<{
      success: boolean;
      data: unknown[];
    }>(search_audit_logs, create_context(SUPER_ADMIN_EMAIL), {
      page_number: 0,
      page_size: -5,
    });
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });
});
