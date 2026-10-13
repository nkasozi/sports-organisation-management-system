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
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { clear_table, update_sync_metadata } from "./sync_admin_mutations";

type MutationResult = { success: boolean; deleted_count?: number };

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        build_team_record("team_a", ORGANIZATION_A_ID, 1),
        build_team_record("team_b", ORGANIZATION_B_ID, 1),
        {
          ...build_team_record("team_blank", ORGANIZATION_A_ID, 1),
          organization_id: "",
        },
      ],
    },
  });
}

const METADATA_COMMAND = {
  table_name: "teams",
  sync_status: "completed",
  records_synced: 3,
};

describe("clear_table", () => {
  it("deletes only the caller organization's records", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await invoke_convex_handler<MutationResult>(
      clear_table,
      context,
      {
        table_name: "teams",
      },
    );
    expect(result).toMatchObject({ success: true, deleted_count: 1 });
    expect(find_table_rows(context, "teams")).toHaveLength(2);
  });

  it("denies callers without an organization scope", async () => {
    const context = create_context(UNSCOPED_USER_EMAIL);
    const result = await invoke_convex_handler<MutationResult>(
      clear_table,
      context,
      {
        table_name: "teams",
      },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(3);
  });
});

describe("update_sync_metadata", () => {
  it("lets super admins record sync metadata", async () => {
    const context = create_context(SUPER_ADMIN_EMAIL);
    const result = await invoke_convex_handler<MutationResult>(
      update_sync_metadata,
      context,
      METADATA_COMMAND,
    );
    expect(result.success).toBe(true);
    expect(find_table_rows(context, "sync_metadata")).toHaveLength(1);
  });

  it("rejects tables outside the sync allowlist", async () => {
    const context = create_context(SUPER_ADMIN_EMAIL);
    const result = await invoke_convex_handler<MutationResult>(
      update_sync_metadata,
      context,
      { ...METADATA_COMMAND, table_name: "role_permissions" },
    );
    expect(result.success).toBe(false);
  });

  it("rejects organization-scoped callers from overwriting shared metadata", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await invoke_convex_handler<MutationResult>(
      update_sync_metadata,
      context,
      METADATA_COMMAND,
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "sync_metadata")).toHaveLength(0);
  });
});
