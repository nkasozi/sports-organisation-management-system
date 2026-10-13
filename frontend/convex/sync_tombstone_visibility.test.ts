import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
  with_identity,
} from "./lib/fake_convex_context.test_support";
import { PARENT_TABLE_ROWS } from "./lib/parent_scoped_fixtures.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ADMIN_EMAIL,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_delete } from "./sync_batch_delete_mutation";
import { batch_upsert } from "./sync_batch_mutation";
import { get_changes_page } from "./sync_change_queries";

interface ChangesPage {
  status: string;
  records: Array<{ local_id: string }>;
  tombstones: Array<{ local_id: string }>;
}

const STAGE_A = {
  local_id: "stage_a",
  competition_id: "competition_a",
  name: "Pool A",
  stage_type: "group",
  version: 1,
  sync_sequence: 1,
};

function create_context(
  tables: Record<string, Array<Record<string, unknown>>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(SUPER_ADMIN_EMAIL),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      sync_sequence_backfill_states: [
        "competition_stages",
        "competitions",
        "teams",
      ].map((table_name) => ({
        table_name,
        status: "complete",
        backfilled_count: 0,
        updated_at: "2024-01-01T00:00:00.000Z",
      })),
      ...tables,
    },
  });
}

async function delete_as_super_admin(
  context: FakeConvexContext,
  table_name: string,
  local_id: string,
  version: number,
): Promise<unknown> {
  return invoke_convex_handler(batch_delete, context, {
    table_name,
    records: [{ local_id, base_version: { kind: "known", version } }],
  });
}

async function read_tombstone_ids(
  context: FakeConvexContext,
  email: string,
  table_name: string,
): Promise<string[]> {
  const page = await invoke_convex_handler<ChangesPage>(
    get_changes_page,
    with_identity(context, authenticated_identity(email)),
    { table_name, after_sequence: 0 },
  );
  return page.tombstones.map((row) => row.local_id);
}

describe("parent scoped tombstones", () => {
  it("stay visible to the owning organization after the parent is deleted", async () => {
    const context = create_context({
      competitions: PARENT_TABLE_ROWS.competitions,
      competition_stages: [STAGE_A],
    });
    await delete_as_super_admin(context, "competition_stages", "stage_a", 1);
    await delete_as_super_admin(context, "competitions", "competition_a", 1);
    expect(
      await read_tombstone_ids(
        context,
        ORGANIZATION_A_ADMIN_EMAIL,
        "competition_stages",
      ),
    ).toEqual(["stage_a"]);
    expect(
      await read_tombstone_ids(
        context,
        ORGANIZATION_B_ADMIN_EMAIL,
        "competition_stages",
      ),
    ).toEqual([]);
  });

  it("store the organization resolved at delete time on the tombstone", async () => {
    const context = create_context({
      competitions: PARENT_TABLE_ROWS.competitions,
      competition_stages: [STAGE_A],
    });
    await delete_as_super_admin(context, "competition_stages", "stage_a", 1);
    expect(find_table_rows(context, "sync_tombstones")[0].visibility).toEqual({
      kind: "deleted",
      scope: {
        fields: { local_id: "stage_a" },
        parent_organization: {
          kind: "resolved",
          organization_id: ORGANIZATION_A_ID,
        },
      },
    });
  });
});

describe("scope exit tombstones", () => {
  it("tell the previous organization to drop a record that moved away", async () => {
    const context = create_context({
      teams: [{ ...build_team_record("team_x", ORGANIZATION_A_ID, 1) }],
    });
    await invoke_convex_handler(batch_upsert, context, {
      table_name: "teams",
      records: [
        {
          local_id: "team_x",
          data: build_team_record("team_x", ORGANIZATION_B_ID, 1),
          version: 1,
          base_version: { kind: "known", version: 1 },
        },
      ],
    });
    expect(
      await read_tombstone_ids(context, ORGANIZATION_A_ADMIN_EMAIL, "teams"),
    ).toEqual(["team_x"]);
    expect(
      await read_tombstone_ids(context, ORGANIZATION_B_ADMIN_EMAIL, "teams"),
    ).toEqual([]);
    expect(
      await read_tombstone_ids(context, SUPER_ADMIN_EMAIL, "teams"),
    ).toEqual([]);
  });

  it("are not written when the scope is unchanged", async () => {
    const context = create_context({
      teams: [{ ...build_team_record("team_x", ORGANIZATION_A_ID, 1) }],
    });
    await invoke_convex_handler(batch_upsert, context, {
      table_name: "teams",
      records: [
        {
          local_id: "team_x",
          data: {
            ...build_team_record("team_x", ORGANIZATION_A_ID, 1),
            name: "Renamed",
          },
          version: 1,
          base_version: { kind: "known", version: 1 },
        },
      ],
    });
    expect(find_table_rows(context, "sync_tombstones")).toEqual([]);
  });
});
