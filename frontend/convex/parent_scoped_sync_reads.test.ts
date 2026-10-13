import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  type FakeIdentity,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  PARENT_SCOPED_ROWS,
  PARENT_TABLE_ROWS,
} from "./lib/parent_scoped_fixtures.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import {
  get_latest_modified_at,
  subscribe_to_table_changes,
} from "./sync_metadata_queries";
import {
  get_all_records,
  get_changes_since,
  get_record_by_local_id,
} from "./sync_read_queries";

type StoredRecord = Record<string, unknown>;

function create_context(identity: FakeIdentity): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: ALL_FIXTURE_USERS,
      ...PARENT_TABLE_ROWS,
      ...PARENT_SCOPED_ROWS,
    },
  });
}

async function read_all(
  identity: FakeIdentity,
  table_name: string,
): Promise<unknown[]> {
  const records = await invoke_convex_handler<StoredRecord[]>(
    get_all_records,
    create_context(identity),
    { table_name },
  );
  return records.map((record) => record.local_id);
}

const ORGANIZATION_A_IDENTITY = authenticated_identity(
  ORGANIZATION_A_ADMIN_EMAIL,
);

describe("parent scoped reads", () => {
  it("scope get_all_records to records whose parent the caller owns", async () => {
    expect(
      await read_all(ORGANIZATION_A_IDENTITY, "competition_stages"),
    ).toEqual(["stage_a"]);
    expect(await read_all(ORGANIZATION_A_IDENTITY, "identifications")).toEqual([
      "identification_a",
    ]);
    expect(await read_all(ORGANIZATION_A_IDENTITY, "profile_links")).toEqual([
      "link_a",
    ]);
  });

  it("return everything to super admins and nothing to unscoped callers", async () => {
    expect(
      await read_all(
        authenticated_identity(SUPER_ADMIN_EMAIL),
        "identifications",
      ),
    ).toHaveLength(2);
    expect(
      await read_all(
        authenticated_identity(UNSCOPED_USER_EMAIL),
        "identifications",
      ),
    ).toEqual([]);
  });

  it("keep public parent scoped tables readable anonymously but never identifications", async () => {
    expect(
      await read_all(ANONYMOUS_IDENTITY, "competition_stages"),
    ).toHaveLength(2);
    expect(await read_all(ANONYMOUS_IDENTITY, "identifications")).toEqual([]);
  });

  it("scope incremental, single-record and metadata reads", async () => {
    const context = create_context(ORGANIZATION_A_IDENTITY);
    const changes = await invoke_convex_handler<{ data: StoredRecord[] }>(
      get_changes_since,
      context,
      {
        table_name: "identifications",
        since_timestamp: "1970-01-01T00:00:00.000Z",
      },
    );
    const foreign_lookup = await invoke_convex_handler<{ status: string }>(
      get_record_by_local_id,
      context,
      {
        table_name: "identifications",
        local_id: "identification_b",
      },
    );
    const latest = await invoke_convex_handler<{ record_count: number }>(
      get_latest_modified_at,
      context,
      {
        table_name: "identifications",
      },
    );
    const subscription = await invoke_convex_handler<{ record_count: number }>(
      subscribe_to_table_changes,
      context,
      {
        table_name: "profile_links",
      },
    );
    expect(changes.data.map((record) => record.local_id)).toEqual([
      "identification_a",
    ]);
    expect(foreign_lookup.status).toBe("not_found");
    expect(latest.record_count).toBe(1);
    expect(subscription.record_count).toBe(1);
  });
});
