import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeIdentity,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { get_sync_metadata } from "./sync_metadata_queries";

const TEAMS_METADATA = { table_name: "teams", sync_status: "completed" };
const FAILED_USERS_METADATA = {
  table_name: "system_users",
  sync_status: "failed",
  records_synced: 0,
  error_message: "Duplicate email admin@example.com",
};

async function read_metadata(
  identity: FakeIdentity,
  function_arguments: Record<string, unknown>,
): Promise<{ status: string; records?: Array<Record<string, unknown>> }> {
  const context = create_fake_convex_context({
    identity,
    tables: {
      system_users: ALL_FIXTURE_USERS,
      sync_metadata: [TEAMS_METADATA, FAILED_USERS_METADATA],
    },
  });
  return invoke_convex_handler<{
    status: string;
    records?: Array<Record<string, unknown>>;
  }>(get_sync_metadata, context, function_arguments);
}

describe("get_sync_metadata", () => {
  it("rejects anonymous callers", async () => {
    expect(await read_metadata(ANONYMOUS_IDENTITY, {})).toEqual({
      status: "unauthorized",
    });
  });

  it("returns metadata for an allowed table", async () => {
    expect(
      await read_metadata(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL), {
        table_name: "teams",
      }),
    ).toMatchObject({ status: "record", record: TEAMS_METADATA });
  });

  it("does not look up tables outside the sync allowlist", async () => {
    expect(
      await read_metadata(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL), {
        table_name: "role_permissions",
      }),
    ).toEqual({ status: "not_found" });
  });

  it("strips error details and unreadable tables for non super admins", async () => {
    const result = await read_metadata(
      authenticated_identity(ORGANIZATION_A_PLAYER_EMAIL),
      {},
    );
    expect(result.records).toEqual([TEAMS_METADATA]);
    const admin_result = await read_metadata(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      { table_name: "system_users" },
    );
    expect(admin_result).toMatchObject({ status: "record" });
    expect(
      (admin_result as { record?: Record<string, unknown> }).record,
    ).not.toHaveProperty("error_message");
  });

  it("returns full metadata rows to super admins", async () => {
    const result = await read_metadata(
      authenticated_identity(SUPER_ADMIN_EMAIL),
      {},
    );
    expect(result.records).toEqual([TEAMS_METADATA, FAILED_USERS_METADATA]);
  });
});
