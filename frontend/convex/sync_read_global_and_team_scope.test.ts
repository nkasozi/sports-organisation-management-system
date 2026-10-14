import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  type FakeIdentity,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import { MANAGER_EMAIL } from "./lib/scoped_write_fixtures.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { get_changes_page } from "./sync_change_queries";
import { get_all_records } from "./sync_read_queries";

type StoredRecord = Record<string, unknown>;

const SYNCED_AT = "2024-01-01T00:00:00.000Z";
const USERS = ALL_FIXTURE_USERS.map((user) =>
  user.email === MANAGER_EMAIL ? { ...user, team_id: "team_a" } : user,
);

function build_sport(
  local_id: string,
  organization_id: string,
  sync_sequence: number,
): StoredRecord {
  return {
    local_id,
    organization_id,
    name: local_id,
    synced_at: SYNCED_AT,
    version: 1,
    sync_sequence,
  };
}

function build_team_row(
  local_id: string,
  team_id: string,
  sync_sequence: number,
): StoredRecord {
  return {
    local_id,
    organization_id: ORGANIZATION_A_ID,
    team_id,
    player_id: `player_${local_id}`,
    fixture_id: "fixture_a",
    synced_at: SYNCED_AT,
    version: 1,
    sync_sequence,
  };
}

function create_context(identity: FakeIdentity): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: USERS,
      sports: [
        build_sport("sport_global", "*", 1),
        build_sport("sport_unscoped", "", 2),
        build_sport("sport_org_a", ORGANIZATION_A_ID, 3),
        build_sport("sport_org_b", ORGANIZATION_B_ID, 4),
      ],
      player_team_memberships: [
        build_team_row("membership_own", "team_a", 1),
        build_team_row("membership_rival", "team_a2", 2),
      ],
      fixture_lineups: [
        build_team_row("lineup_own", "team_a", 1),
        build_team_row("lineup_rival", "team_a2", 2),
      ],
      sync_sequence_backfill_states: [
        {
          table_name: "sports",
          status: "complete",
          backfilled_count: 0,
          updated_at: SYNCED_AT,
        },
      ],
    },
  });
}

async function read_local_ids(
  identity: FakeIdentity,
  table_name: string,
): Promise<unknown[]> {
  const records = await invoke_convex_handler<StoredRecord[]>(
    get_all_records,
    create_context(identity),
    { table_name },
  );
  return records.map((record) => record.local_id).sort();
}

describe("global reference tables are scoped by organization", () => {
  it("gives an organization caller the global rows plus their own organization's rows", async () => {
    expect(
      await read_local_ids(
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
        "sports",
      ),
    ).toEqual(["sport_global", "sport_org_a", "sport_unscoped"]);
  });

  it("gives a super admin every row", async () => {
    expect(
      await read_local_ids(authenticated_identity(SUPER_ADMIN_EMAIL), "sports"),
    ).toHaveLength(4);
  });

  it("gives anonymous public readers only the global rows", async () => {
    expect(await read_local_ids(ANONYMOUS_IDENTITY, "sports")).toEqual([
      "sport_global",
      "sport_unscoped",
    ]);
  });

  it("keeps another organization's global table rows out of the change feed", async () => {
    const page = await invoke_convex_handler<{ records: StoredRecord[] }>(
      get_changes_page,
      create_context(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL)),
      { table_name: "sports", after_sequence: 0 },
    );
    expect(page.records.map((record) => record.local_id)).not.toContain(
      "sport_org_b",
    );
  });
});

describe("team managers read organisation level data org wide", () => {
  it("lets a team manager read every membership in their organization", async () => {
    expect(
      await read_local_ids(
        authenticated_identity(MANAGER_EMAIL),
        "player_team_memberships",
      ),
    ).toEqual(["membership_own", "membership_rival"]);
  });

  it("lets a team manager read the opponent lineup", async () => {
    expect(
      await read_local_ids(
        authenticated_identity(MANAGER_EMAIL),
        "fixture_lineups",
      ),
    ).toEqual(["lineup_own", "lineup_rival"]);
  });
});
