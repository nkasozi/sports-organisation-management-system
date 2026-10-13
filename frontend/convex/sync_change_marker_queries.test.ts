import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  invoke_convex_handler,
  with_identity,
} from "./lib/fake_convex_context.test_support";
import { PARENT_TABLE_ROWS } from "./lib/parent_scoped_fixtures.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  GLOBAL_SCOPE_ID,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ADMIN_EMAIL,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";
import { get_table_change_marker } from "./sync_change_marker_queries";
import { backfill_sync_sequences_batch } from "./sync_sequence_backfill";

const UNKNOWN_BASE = { kind: "unknown" };

function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(SUPER_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, ...PARENT_TABLE_ROWS },
  });
}

async function write_as(
  context: FakeConvexContext,
  email: string,
  table_name: string,
  record: Record<string, unknown>,
): Promise<{ success: boolean }> {
  return invoke_convex_handler(
    batch_upsert,
    with_identity(context, authenticated_identity(email)),
    {
      table_name,
      records: [
        {
          local_id: record.local_id,
          data: record,
          version: 1,
          base_version: UNKNOWN_BASE,
        },
      ],
    },
  );
}

async function read_marker(
  context: FakeConvexContext,
  email: string,
  table_name: string,
): Promise<number> {
  const marker = await invoke_convex_handler<{ latest_sequence: number }>(
    get_table_change_marker,
    with_identity(context, authenticated_identity(email)),
    { table_name },
  );
  return marker.latest_sequence;
}

describe("get_table_change_marker tenant scoping", () => {
  it("does not reveal another organization's writes", async () => {
    const context = create_context();
    await write_as(context, ORGANIZATION_B_ADMIN_EMAIL, "teams", {
      ...build_team_record("team_b1", ORGANIZATION_B_ID, 1),
    });
    expect(
      await read_marker(context, ORGANIZATION_A_ADMIN_EMAIL, "teams"),
    ).toBe(0);
    expect(
      await read_marker(context, ORGANIZATION_B_ADMIN_EMAIL, "teams"),
    ).toBe(1);
  });

  it("moves for the caller's own organization and for shared records it can see", async () => {
    const context = create_context();
    await write_as(context, ORGANIZATION_A_ADMIN_EMAIL, "teams", {
      ...build_team_record("team_a1", ORGANIZATION_A_ID, 1),
    });
    await write_as(context, ORGANIZATION_B_ADMIN_EMAIL, "teams", {
      ...build_team_record("team_b1", ORGANIZATION_B_ID, 1),
    });
    await write_as(context, SUPER_ADMIN_EMAIL, "teams", {
      ...build_team_record("team_shared", GLOBAL_SCOPE_ID, 1),
    });
    expect(
      await read_marker(context, ORGANIZATION_A_ADMIN_EMAIL, "teams"),
    ).toBe(3);
    expect(await read_marker(context, SUPER_ADMIN_EMAIL, "teams")).toBe(3);
  });

  it("scopes parent-owned tables through the parent's organization", async () => {
    const context = create_context();
    await write_as(context, ORGANIZATION_B_ADMIN_EMAIL, "competition_stages", {
      local_id: "stage_b",
      competition_id: "competition_b",
      name: "Pool B",
      stage_type: "group",
    });
    expect(
      await read_marker(
        context,
        ORGANIZATION_A_ADMIN_EMAIL,
        "competition_stages",
      ),
    ).toBe(0);
    expect(
      await read_marker(
        context,
        ORGANIZATION_B_ADMIN_EMAIL,
        "competition_stages",
      ),
    ).toBe(1);
  });

  it("shares the table-wide marker for shared reference tables", async () => {
    const context = create_context();
    await write_as(context, SUPER_ADMIN_EMAIL, "genders", {
      local_id: "gender_x",
      name: "Mixed",
      organization_id: GLOBAL_SCOPE_ID,
    });
    expect(
      await read_marker(context, ORGANIZATION_A_ADMIN_EMAIL, "genders"),
    ).toBe(1);
  });

  it("reports no changes to callers without an organization scope", async () => {
    const context = create_context();
    await write_as(context, SUPER_ADMIN_EMAIL, "teams", {
      ...build_team_record("team_shared", GLOBAL_SCOPE_ID, 1),
    });
    expect(await read_marker(context, UNSCOPED_USER_EMAIL, "teams")).toBe(0);
  });

  it("moves the owning organization's marker when legacy rows are backfilled", async () => {
    const context = create_fake_convex_context({
      identity: authenticated_identity(SUPER_ADMIN_EMAIL),
      tables: {
        system_users: ALL_FIXTURE_USERS,
        teams: [build_team_record("legacy_a", ORGANIZATION_A_ID, 1)],
      },
    });
    await invoke_convex_handler(backfill_sync_sequences_batch, context, {
      run: { kind: "scheduled_start" },
    });
    expect(
      await read_marker(context, ORGANIZATION_A_ADMIN_EMAIL, "teams"),
    ).toBe(1);
    expect(
      await read_marker(context, ORGANIZATION_B_ADMIN_EMAIL, "teams"),
    ).toBe(0);
  });
});
