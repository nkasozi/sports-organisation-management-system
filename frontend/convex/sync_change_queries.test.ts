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
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import { get_changes_page } from "./sync_change_queries";

interface ChangesPage {
  success: boolean;
  records: Array<{ local_id: string }>;
  tombstones: Array<{ local_id: string; version: number }>;
  next_cursor: number;
  has_more: boolean;
}

function sequenced_team(
  local_id: string,
  organization_id: string,
  sync_sequence: number,
): Record<string, unknown> {
  return { ...build_team_record(local_id, organization_id, 1), sync_sequence };
}

function tombstone(
  local_id: string,
  organization_id: string,
  sync_sequence: number,
): Record<string, unknown> {
  return {
    table_name: "teams",
    local_id,
    version: 2,
    sync_sequence,
    deleted_at: "2024-01-02T00:00:00.000Z",
    scope: { local_id, organization_id },
  };
}

const COMPLETED_TEAMS_BACKFILL = {
  table_name: "teams",
  status: "complete",
  backfilled_count: 0,
  updated_at: "2024-01-01T00:00:00.000Z",
};

function create_context(
  identity = authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        sequenced_team("team_a1", ORGANIZATION_A_ID, 1),
        sequenced_team("team_b1", ORGANIZATION_B_ID, 2),
        sequenced_team("team_a2", ORGANIZATION_A_ID, 4),
      ],
      sync_tombstones: [
        tombstone("team_a0", ORGANIZATION_A_ID, 3),
        tombstone("team_b0", ORGANIZATION_B_ID, 5),
      ],
      sync_change_sequences: [{ table_name: "teams", last_sequence: 5 }],
      sync_sequence_backfill_states: [COMPLETED_TEAMS_BACKFILL],
    },
  });
}

async function read_page(
  context: ReturnType<typeof create_context>,
  after_sequence: number,
  page_size: number,
): Promise<ChangesPage> {
  return invoke_convex_handler<ChangesPage>(get_changes_page, context, {
    table_name: "teams",
    after_sequence,
    page_size,
  });
}

describe("get_changes_page", () => {
  it("returns only the caller's records and tombstones in sequence order", async () => {
    const page = await read_page(create_context(), 0, 10);
    expect(page.records.map((row) => row.local_id)).toEqual([
      "team_a1",
      "team_a2",
    ]);
    expect(page.tombstones).toEqual([
      { local_id: "team_a0", version: 2, sync_sequence: 3 },
    ]);
    expect(page.next_cursor).toBe(5);
    expect(page.has_more).toBe(false);
  });

  it("paginates from the persisted cursor without dropping changes", async () => {
    const context = create_context();
    const first_page = await read_page(context, 0, 2);
    const second_page = await read_page(context, first_page.next_cursor, 2);
    const third_page = await read_page(context, second_page.next_cursor, 2);
    expect(first_page).toMatchObject({ next_cursor: 2, has_more: true });
    expect(second_page.tombstones.map((row) => row.local_id)).toEqual([
      "team_a0",
    ]);
    expect(second_page.records.map((row) => row.local_id)).toEqual(["team_a2"]);
    expect(third_page).toMatchObject({ next_cursor: 5, has_more: false });
  });

  it("denies anonymous callers", async () => {
    const page = await read_page(create_context(ANONYMOUS_IDENTITY), 0, 10);
    expect(page.success).toBe(false);
    expect(page.records).toEqual([]);
  });
});
