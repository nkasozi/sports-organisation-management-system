import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_player_record,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { get_changes_page } from "./sync_change_queries";
import { subscribe_to_table_changes } from "./sync_metadata_queries";
import { get_all_records, get_record_by_local_id } from "./sync_read_queries";

type StoredRecord = Record<string, unknown>;

const MANAGER_EMAIL = "manager.a@example.com";
const VIEWER_EMAIL = "viewer.a@example.com";

const SCOPED_USERS = ALL_FIXTURE_USERS.map((user) => {
  if (user.email === ORGANIZATION_A_PLAYER_EMAIL)
    return { ...user, player_id: "player_a" };
  if (user.email === MANAGER_EMAIL) return { ...user, team_id: "team_a" };
  return user;
});
const VIEWER_USER = {
  ...ALL_FIXTURE_USERS[1],
  local_id: "user_viewer_a",
  email: VIEWER_EMAIL,
  role: "public_viewer",
};

function sequenced(record: StoredRecord, sync_sequence: number): StoredRecord {
  return { ...record, sync_sequence };
}

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: [...SCOPED_USERS, VIEWER_USER].map((user, index) =>
        sequenced(user, index + 1),
      ),
      teams: [build_team_record("team_a", ORGANIZATION_A_ID, 1)],
      players: [
        build_player_record("player_a", ORGANIZATION_A_ID),
        build_player_record("player_a2", ORGANIZATION_A_ID),
      ],
      identifications: [
        { local_id: "id_a", holder_type: "player", holder_id: "player_a" },
        { local_id: "id_a2", holder_type: "player", holder_id: "player_a2" },
      ],
      calendar_tokens: [
        {
          local_id: "tok_player",
          organization_id: ORGANIZATION_A_ID,
          user_id: "user_player_a",
          token: "secret_1",
        },
        {
          local_id: "tok_admin",
          organization_id: ORGANIZATION_A_ID,
          user_id: "user_admin_a",
          token: "secret_2",
        },
      ],
      sync_sequence_backfill_states: [
        {
          table_name: "system_users",
          status: "complete",
          backfilled_count: 0,
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  });
}

async function read_all(
  email: string,
  table_name: string,
): Promise<StoredRecord[]> {
  return invoke_convex_handler<StoredRecord[]>(
    get_all_records,
    create_context(email),
    { table_name },
  );
}

function local_ids(records: StoredRecord[]): unknown[] {
  return records.map((record) => record.local_id);
}

describe("sync reads enforce role read permission", () => {
  it("gives players only their own system user record", async () => {
    const records = await read_all(ORGANIZATION_A_PLAYER_EMAIL, "system_users");
    expect(records.map((record) => record.email)).toEqual([
      ORGANIZATION_A_PLAYER_EMAIL,
    ]);
  });

  it("applies the same rule to the change feed and table subscriptions", async () => {
    const page = await invoke_convex_handler<{ records: StoredRecord[] }>(
      get_changes_page,
      create_context(ORGANIZATION_A_PLAYER_EMAIL),
      { table_name: "system_users", after_sequence: 0 },
    );
    expect(page.records.map((record) => record.email)).toEqual([
      ORGANIZATION_A_PLAYER_EMAIL,
    ]);
    const snapshot = await invoke_convex_handler<{ records: StoredRecord[] }>(
      subscribe_to_table_changes,
      create_context(VIEWER_EMAIL),
      { table_name: "system_users" },
    );
    expect(snapshot.records.map((record) => record.email)).toEqual([
      VIEWER_EMAIL,
    ]);
  });

  it("still gives org admins every system user in their organization", async () => {
    const records = await read_all(ORGANIZATION_A_ADMIN_EMAIL, "system_users");
    expect(records.length).toBeGreaterThan(2);
  });

  it("strips other players' private fields but keeps the caller's own", async () => {
    const records = await read_all(ORGANIZATION_A_PLAYER_EMAIL, "players");
    const own = records.find((record) => record.local_id === "player_a");
    const other = records.find((record) => record.local_id === "player_a2");
    expect(own?.medical_notes).toBe("asthma");
    expect(other).not.toHaveProperty("medical_notes");
    expect(other).not.toHaveProperty("date_of_birth");
    expect(other?.first_name).toBe("Pat");
  });

  it("limits identifications and calendar tokens to the caller's own", async () => {
    expect(
      local_ids(await read_all(ORGANIZATION_A_PLAYER_EMAIL, "identifications")),
    ).toEqual(["id_a"]);
    expect(
      local_ids(await read_all(ORGANIZATION_A_PLAYER_EMAIL, "calendar_tokens")),
    ).toEqual(["tok_player"]);
    expect(
      local_ids(await read_all(ORGANIZATION_A_ADMIN_EMAIL, "calendar_tokens")),
    ).toEqual(["tok_player", "tok_admin"]);
  });

  it("hides a single record the caller may not read", async () => {
    const result = await invoke_convex_handler<{ status: string }>(
      get_record_by_local_id,
      create_context(ORGANIZATION_A_PLAYER_EMAIL),
      { table_name: "calendar_tokens", local_id: "tok_admin" },
    );
    expect(result.status).toBe("not_found");
  });

  it("lets a team manager read their own team", async () => {
    expect(local_ids(await read_all(MANAGER_EMAIL, "teams"))).toEqual([
      "team_a",
    ]);
  });
});
