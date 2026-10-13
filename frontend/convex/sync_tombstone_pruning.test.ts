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
import {
  SYNC_TOMBSTONE_RETENTION_DAYS,
  TOMBSTONE_PRUNE_BATCH_SIZE,
} from "./lib/sync_tombstone_retention";
import { get_changes_page } from "./sync_change_queries";
import { prune_expired_tombstones_batch } from "./sync_tombstone_pruning";

const EXPIRED_DELETED_AT = "2020-01-01T00:00:00.000Z";

function tombstone(
  local_id: string,
  sync_sequence: number,
  deleted_at: string,
): Record<string, unknown> {
  return {
    table_name: "teams",
    local_id,
    version: 2,
    sync_sequence,
    deleted_at,
    scope: { local_id, organization_id: ORGANIZATION_A_ID },
  };
}

function create_context(
  tombstones: Array<Record<string, unknown>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        {
          ...build_team_record("team_live", ORGANIZATION_A_ID, 1),
          sync_sequence: 20,
        },
      ],
      sync_tombstones: tombstones,
      sync_sequence_backfill_states: [
        {
          table_name: "teams",
          status: "complete",
          backfilled_count: 0,
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  });
}

async function prune(
  context: ReturnType<typeof create_context>,
): Promise<{ pruned_count: number; status: string }> {
  return invoke_convex_handler<{ pruned_count: number; status: string }>(
    prune_expired_tombstones_batch,
    context,
    { retention_days: SYNC_TOMBSTONE_RETENTION_DAYS, continuation_count: 0 },
  );
}

describe("prune_expired_tombstones_batch", () => {
  it("prunes only tombstones past retention and records the table watermark", async () => {
    const recent = new Date().toISOString();
    const context = create_context([
      tombstone("team_old_1", 4, EXPIRED_DELETED_AT),
      tombstone("team_old_2", 7, EXPIRED_DELETED_AT),
      tombstone("team_recent", 15, recent),
    ]);
    const result = await prune(context);
    expect(result).toEqual({ pruned_count: 2, status: "drained" });
    expect(
      find_table_rows(context, "sync_tombstones").map((row) => row.local_id),
    ).toEqual(["team_recent"]);
    expect(find_table_rows(context, "sync_prune_watermarks")).toMatchObject([
      { table_name: "teams", pruned_through_sequence: 7 },
    ]);
  });

  it("schedules a bounded continuation when more expired tombstones remain", async () => {
    const context = create_context(
      Array.from({ length: TOMBSTONE_PRUNE_BATCH_SIZE + 5 }, (_unused, index) =>
        tombstone(`team_${index}`, index + 1, EXPIRED_DELETED_AT),
      ),
    );
    const result = await prune(context);
    expect(result.status).toBe("continued");
    expect(
      context.scheduled_calls[context.scheduled_calls.length - 1]
        ?.function_arguments,
    ).toEqual({
      retention_days: SYNC_TOMBSTONE_RETENTION_DAYS,
      continuation_count: 1,
    });
  });
});

describe("get_changes_page cursor expiry", () => {
  it("tells a client whose cursor predates the prune horizon to resync", async () => {
    const context = create_context([
      tombstone("team_old", 7, EXPIRED_DELETED_AT),
    ]);
    await prune(context);
    const expired = await invoke_convex_handler<Record<string, unknown>>(
      get_changes_page,
      context,
      { table_name: "teams", after_sequence: 3, page_size: 10 },
    );
    expect(expired).toMatchObject({
      success: true,
      status: "cursor_expired",
      records: [],
      tombstones: [],
    });
    const current = await invoke_convex_handler<Record<string, unknown>>(
      get_changes_page,
      context,
      { table_name: "teams", after_sequence: 7, page_size: 10 },
    );
    expect(current).toMatchObject({ success: true, status: "changes" });
    const fresh = await invoke_convex_handler<Record<string, unknown>>(
      get_changes_page,
      context,
      { table_name: "teams", after_sequence: 0, page_size: 10 },
    );
    expect(fresh).toMatchObject({ success: true, status: "changes" });
  });
});
