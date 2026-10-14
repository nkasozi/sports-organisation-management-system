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
  build_player_record,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import { get_all_records } from "./sync_read_queries";
import { get_records_page } from "./sync_record_page_queries";

type StoredRecord = Record<string, unknown>;

interface RecordsPage {
  success: boolean;
  records: StoredRecord[];
  next_cursor: string;
  has_more: boolean;
}

const USERS = ALL_FIXTURE_USERS.map((user) =>
  user.email === MANAGER_EMAIL ? { ...user, team_id: "team_a1" } : user,
);

function create_context(identity: FakeIdentity): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: USERS,
      organizations: [
        { local_id: ORGANIZATION_A_ID, name: "A", contact_email: "a@x.io" },
        { local_id: ORGANIZATION_B_ID, name: "B", contact_email: "b@x.io" },
      ],
      teams: [
        build_team_record("team_a1", ORGANIZATION_A_ID, 1),
        build_team_record("team_a2", ORGANIZATION_A_ID, 1),
        build_team_record("team_a3", ORGANIZATION_A_ID, 1),
        build_team_record("team_b1", ORGANIZATION_B_ID, 1),
      ],
      players: [
        build_player_record("player_a", ORGANIZATION_A_ID),
        build_player_record("player_b", ORGANIZATION_B_ID),
      ],
      player_profiles: [
        { local_id: "profile_a", player_id: "player_a", version: 1 },
        { local_id: "profile_b", player_id: "player_b", version: 1 },
      ],
    },
  });
}

async function read_all(
  context: FakeConvexContext,
  table_name: string,
  extra_arguments: Record<string, unknown> = {},
): Promise<unknown[]> {
  const records = await invoke_convex_handler<StoredRecord[]>(
    get_all_records,
    context,
    { table_name, ...extra_arguments },
  );
  return records.map((record) => record.local_id).sort();
}

async function read_page(
  context: FakeConvexContext,
  page_arguments: Record<string, unknown>,
): Promise<RecordsPage> {
  return invoke_convex_handler<RecordsPage>(
    get_records_page,
    context,
    page_arguments,
  );
}

describe("authenticated snapshot reads use organization indexes", () => {
  it("reads only the caller organization's teams without a full table scan", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    );
    expect(await read_all(context, "teams")).toEqual([
      "team_a1",
      "team_a2",
      "team_a3",
    ]);
    expect(context.unindexed_collects).not.toContain("teams");
  });

  it("reads parent scoped rows through their parents without a full table scan", async () => {
    const context = create_context(authenticated_identity(MANAGER_EMAIL));
    expect(await read_all(context, "player_profiles")).toEqual(["profile_a"]);
    expect(context.unindexed_collects).toEqual([]);
  });
});

describe("anonymous snapshot reads are organization scoped", () => {
  it("returns only the requested organization's public rows", async () => {
    const context = create_context(ANONYMOUS_IDENTITY);
    expect(
      await read_all(context, "teams", { organization_id: ORGANIZATION_B_ID }),
    ).toEqual(["team_b1"]);
    expect(context.unindexed_collects).toEqual([]);
  });

  it("projects private player fields for anonymous readers", async () => {
    const records = await invoke_convex_handler<StoredRecord[]>(
      get_all_records,
      create_context(ANONYMOUS_IDENTITY),
      { table_name: "players", organization_id: ORGANIZATION_A_ID },
    );
    expect(records).toHaveLength(1);
    expect(records[0]).not.toHaveProperty("medical_notes");
  });
});

describe("get_records_page", () => {
  it("pages through the caller organization's rows with a local id cursor", async () => {
    const context = create_context(
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    );
    const first = await read_page(context, {
      table_name: "teams",
      page_size: 2,
    });
    expect(first.records.map((record) => record.local_id)).toEqual([
      "team_a1",
      "team_a2",
    ]);
    expect(first.has_more).toBe(true);
    const second = await read_page(context, {
      table_name: "teams",
      page_size: 2,
      after_local_id: first.next_cursor,
    });
    expect(second.records.map((record) => record.local_id)).toEqual([
      "team_a3",
    ]);
    expect(second.has_more).toBe(false);
  });

  it("pages an anonymous reader through the requested organization's public rows", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), {
      table_name: "teams",
      organization_id: ORGANIZATION_A_ID,
    });
    expect(page.records).toHaveLength(3);
  });

  it("rejects anonymous organization data pages without an organization", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), {
      table_name: "teams",
    });
    expect(page.success).toBe(false);
    expect(page.records).toEqual([]);
  });

  it("limits an anonymous organizations page to the requested organization", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), {
      table_name: "organizations",
      organization_id: ORGANIZATION_B_ID,
    });
    expect(page.records.map((record) => record.local_id)).toEqual([
      ORGANIZATION_B_ID,
    ]);
    expect(page.records[0]).not.toHaveProperty("contact_email");
  });

  it("lets anonymous readers page the public organization directory", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), {
      table_name: "organizations",
    });
    expect(page.records).toHaveLength(2);
  });

  it("rejects anonymous reads of tables that are not public", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), {
      table_name: "system_users",
      organization_id: ORGANIZATION_A_ID,
    });
    expect(page.success).toBe(false);
  });
});
