import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
  with_identity,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";
import { ALLOWED_SYNC_TABLES } from "./lib/sync_table_catalog";
import { get_changes_page } from "./sync_change_queries";
import { backfill_sync_sequences_batch } from "./sync_sequence_backfill";

interface BackfillSliceResult {
  backfilled_count: number;
  status: string;
  correlation_id: string;
}

const SCHEDULED_START = { run: { kind: "scheduled_start" } };

function legacy_teams(count: number): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_unused, index) =>
    build_team_record(`legacy_${index}`, ORGANIZATION_A_ID, 1),
  );
}

function create_context(
  teams: Array<Record<string, unknown>>,
): FakeConvexContext {
  return create_fake_convex_context({
    identity: ANONYMOUS_IDENTITY,
    tables: { system_users: ALL_FIXTURE_USERS, teams },
  });
}

async function run_scheduled_backfills(
  context: FakeConvexContext,
): Promise<number> {
  let processed = 0;
  for (;;) {
    const pending = context.scheduled_calls.filter(
      (call) => "run" in call.function_arguments,
    );
    if (processed >= pending.length) return processed;
    await invoke_convex_handler(
      backfill_sync_sequences_batch,
      context,
      pending[processed].function_arguments,
    );
    processed += 1;
  }
}

function read_backfill_status(
  context: FakeConvexContext,
  table_name: string,
): unknown {
  return find_table_rows(context, "sync_sequence_backfill_states").find(
    (row) => row.table_name === table_name,
  )?.status;
}

describe("backfill_sync_sequences_batch", () => {
  it("assigns sequences and marks every drained table complete", async () => {
    const context = create_context(legacy_teams(1));
    const result = await invoke_convex_handler<BackfillSliceResult>(
      backfill_sync_sequences_batch,
      context,
      SCHEDULED_START,
    );
    expect(result).toMatchObject({
      backfilled_count: 1 + ALL_FIXTURE_USERS.length,
      status: "complete",
    });
    expect(result.correlation_id).not.toBe("");
    expect(find_table_rows(context, "teams")[0].sync_sequence).toBe(1);
    for (const table_name of ALLOWED_SYNC_TABLES)
      expect(read_backfill_status(context, table_name), table_name).toBe(
        "complete",
      );
  });

  it("schedules itself with the same correlation id until the table drains", async () => {
    const context = create_context(legacy_teams(450));
    const first = await invoke_convex_handler<BackfillSliceResult>(
      backfill_sync_sequences_batch,
      context,
      SCHEDULED_START,
    );
    expect(first.status).toBe("continued");
    expect(read_backfill_status(context, "teams")).toBe("running");
    expect(context.scheduled_calls[0].function_arguments).toEqual({
      run: {
        kind: "continuation",
        correlation_id: first.correlation_id,
        continuation_count: 1,
      },
    });
    expect(await run_scheduled_backfills(context)).toBe(2);
    expect(read_backfill_status(context, "teams")).toBe("complete");
    expect(
      find_table_rows(context, "teams").every(
        (row) => typeof row.sync_sequence === "number",
      ),
    ).toBe(true);
  });
});

describe("get_changes_page during backfill", () => {
  it("reports backfill_in_progress instead of a partial page", async () => {
    const context = create_context(legacy_teams(450));
    await invoke_convex_handler(
      backfill_sync_sequences_batch,
      context,
      SCHEDULED_START,
    );
    const page = await invoke_convex_handler<Record<string, unknown>>(
      get_changes_page,
      with_identity(
        context,
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      ),
      { table_name: "teams", after_sequence: 0 },
    );
    expect(page).toMatchObject({
      success: true,
      status: "backfill_in_progress",
      records: [],
      tombstones: [],
      next_cursor: 0,
      has_more: false,
    });
    expect(page.retry_after_milliseconds).toBeGreaterThan(0);
  });

  it("treats a table the backfill has never visited as in progress", async () => {
    const context = create_context([]);
    const page = await invoke_convex_handler<{ status: string }>(
      get_changes_page,
      with_identity(
        context,
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      ),
      { table_name: "teams", after_sequence: 0 },
    );
    expect(page.status).toBe("backfill_in_progress");
  });
});
