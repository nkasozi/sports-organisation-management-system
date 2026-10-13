import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
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
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import {
  get_all_records,
  get_changes_since,
  get_record_by_local_id,
} from "./sync_read_queries";

type StoredRecord = Record<string, unknown>;

const PLAYER_PRIVATE_FIELDS = [
  "email",
  "phone",
  "date_of_birth",
  "emergency_contact_name",
  "emergency_contact_phone",
  "medical_notes",
];

function create_context(
  identity: ReturnType<typeof authenticated_identity>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        build_team_record("team_a", ORGANIZATION_A_ID, 1),
        build_team_record("team_b", ORGANIZATION_B_ID, 1),
      ],
      players: [
        build_player_record("player_a", ORGANIZATION_A_ID),
        build_player_record("player_b", ORGANIZATION_B_ID),
      ],
      calendar_tokens: [
        { local_id: "token_a", organization_id: ORGANIZATION_A_ID },
      ],
    },
  });
}

describe("get_all_records characterization", () => {
  it("returns public tables to anonymous callers", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(ANONYMOUS_IDENTITY),
      { table_name: "teams" },
    );
    expect(records).toHaveLength(2);
  });

  it("returns nothing for private tables to anonymous callers", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(ANONYMOUS_IDENTITY),
      { table_name: "calendar_tokens" },
    );
    expect(records).toEqual([]);
  });

  it("scopes authenticated org callers to their organization", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL)),
      { table_name: "teams" },
    );
    expect(records.map((record) => record.local_id)).toEqual(["team_a"]);
  });

  it("returns full player records to authenticated org callers", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL)),
      { table_name: "players" },
    );
    expect(records[0].email).toBe("pat.keeper@example.com");
  });

  it("returns every record to super admins", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(authenticated_identity(SUPER_ADMIN_EMAIL)),
      { table_name: "teams" },
    );
    expect(records).toHaveLength(2);
  });
});

describe("get_all_records anonymous PII projection", () => {
  it("strips personal fields from players for anonymous callers", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(ANONYMOUS_IDENTITY),
      { table_name: "players" },
    );
    expect(records).toHaveLength(2);
    for (const field_name of PLAYER_PRIVATE_FIELDS) {
      expect(records[0]).not.toHaveProperty(field_name);
    }
    expect(records[0]).toMatchObject({
      local_id: "player_a",
      first_name: "Pat",
      nationality: "UG",
    });
  });
});

describe("unscoped callers", () => {
  it("get_all_records returns only the caller's own system user", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(authenticated_identity(UNSCOPED_USER_EMAIL)),
      { table_name: "system_users" },
    );
    expect(records.map((record) => record.email)).toEqual([
      UNSCOPED_USER_EMAIL,
    ]);
  });

  it("get_all_records denies calendar tokens", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(authenticated_identity(UNSCOPED_USER_EMAIL)),
      { table_name: "calendar_tokens" },
    );
    expect(records).toEqual([]);
  });

  it("get_changes_since denies other tenants' records", async () => {
    const result = await invoke_convex_handler<{ data: StoredRecord[] }>(
      get_changes_since,
      create_context(authenticated_identity(UNSCOPED_USER_EMAIL)),
      { table_name: "players", since_timestamp: "1970-01-01T00:00:00.000Z" },
    );
    expect(result.data).toEqual([]);
  });

  it("get_record_by_local_id hides other tenants' records", async () => {
    const result = await invoke_convex_handler<{ status: string }>(
      get_record_by_local_id,
      create_context(authenticated_identity(UNSCOPED_USER_EMAIL)),
      { table_name: "teams", local_id: "team_a" },
    );
    expect(result.status).toBe("not_found");
  });
});
