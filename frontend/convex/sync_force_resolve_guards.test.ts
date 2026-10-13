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
} from "./lib/security_test_fixtures.test_support";
import { force_resolve_conflict } from "./sync_basic_mutations";

type ResolveResult = {
  success: boolean;
  action?: string;
  server_version?: number;
};

const OFFICIAL_EMAIL = "official.a@example.com";
const OFFICIAL_USER = {
  ...ALL_FIXTURE_USERS[1],
  local_id: "user_official_a",
  email: OFFICIAL_EMAIL,
  role: "official",
};
const TEAM_TOMBSTONE = {
  table_name: "teams",
  local_id: "team_gone",
  version: 4,
  sync_sequence: 9,
  deleted_at: "2024-01-02T00:00:00.000Z",
  scope: { local_id: "team_gone", organization_id: ORGANIZATION_A_ID },
};

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: [...ALL_FIXTURE_USERS, OFFICIAL_USER],
      teams: [{ ...build_team_record("team_a", ORGANIZATION_A_ID, 2) }],
      fixtures: [],
      sync_tombstones: [TEAM_TOMBSTONE],
    },
  });
}

async function resolve(
  context: FakeConvexContext,
  command: Record<string, unknown>,
): Promise<ResolveResult> {
  return invoke_convex_handler<ResolveResult>(force_resolve_conflict, context, {
    new_version: 0,
    resolution_action: "keep_local",
    ...command,
  });
}

function find_row(
  context: FakeConvexContext,
  table_name: string,
  local_id: string,
): Record<string, unknown> {
  return (
    find_table_rows(context, table_name).find(
      (row) => row.local_id === local_id,
    ) ?? {}
  );
}

describe("force_resolve_conflict guards", () => {
  it("requires create permission when the record does not exist", async () => {
    const context = create_context(OFFICIAL_EMAIL);
    const result = await resolve(context, {
      table_name: "fixtures",
      local_id: "fixture_new",
      resolved_data: { organization_id: ORGANIZATION_A_ID, notes: "x" },
      base_version: { kind: "unknown" },
    });
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "fixtures")).toEqual([]);
  });

  it("rejects a resolution based on a stale or missing server version", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const resolved_data = { organization_id: ORGANIZATION_A_ID, name: "New" };
    const stale = await resolve(context, {
      table_name: "teams",
      local_id: "team_a",
      resolved_data,
      base_version: { kind: "known", version: 1 },
    });
    const missing = await resolve(context, {
      table_name: "teams",
      local_id: "team_a",
      resolved_data,
    });
    expect(stale.success).toBe(false);
    expect(missing.success).toBe(false);
    expect(find_row(context, "teams", "team_a").name).toBe("Team team_a");
  });

  it("assigns the next server version and records the caller as resolver", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await resolve(context, {
      table_name: "teams",
      local_id: "team_a",
      resolved_data: { organization_id: ORGANIZATION_A_ID, name: "New" },
      base_version: { kind: "known", version: 2 },
      new_version: 1_000_000_000,
      resolved_by: "someone_else",
    });
    expect(result).toMatchObject({ success: true, server_version: 3 });
    expect(find_row(context, "teams", "team_a")).toMatchObject({
      name: "New",
      version: 3,
      conflict_resolved_by: "user_admin_a",
    });
  });

  it("does not resurrect a deleted record without an explicit recreate", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const resolved_data = { organization_id: ORGANIZATION_A_ID, name: "Back" };
    const silent = await resolve(context, {
      table_name: "teams",
      local_id: "team_gone",
      resolved_data,
      base_version: { kind: "unknown" },
    });
    expect(silent.success).toBe(false);
    expect(find_row(context, "teams", "team_gone")).toEqual({});
    const recreated = await resolve(context, {
      table_name: "teams",
      local_id: "team_gone",
      resolved_data,
      base_version: { kind: "recreate" },
    });
    expect(recreated).toMatchObject({ success: true, server_version: 5 });
  });
});
