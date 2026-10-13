import { describe, expect, it } from "vitest";

import type { QueryCtx } from "../_generated/server";
import { clear_table } from "../sync_admin_mutations";
import { get_changes_page } from "../sync_change_queries";
import { continue_sync_clear_job } from "../sync_clear_jobs";
import { invoke_convex_handler } from "./fake_convex_context.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./security_test_fixtures.test_support";
import { with_schema_index_ordering } from "./sync_change_index_harness.test_support";
import {
  create_clear_context,
  run_scheduled_clear_continuations,
  sequenced_teams,
} from "./sync_clear_job_fixtures.test_support";

function descending_local_id_teams(): Array<Record<string, unknown>> {
  return [
    ...sequenced_teams("team_a", ORGANIZATION_A_ID, 120),
    ...sequenced_teams("team_b", ORGANIZATION_B_ID, 3),
  ].reverse();
}

describe("with_schema_index_ordering", () => {
  it("orders an equality-only compound index scan by the remaining index field", async () => {
    const context = with_schema_index_ordering(
      create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
        teams: descending_local_id_teams(),
      }),
    );
    const ctx = context as unknown as { db: QueryCtx["db"] };
    const rows = await (
      ctx.db.query("teams") as unknown as {
        withIndex(
          index_name: string,
          range: (builder: {
            eq(field: string, value: string): unknown;
          }) => unknown,
        ): { take(limit: number): Promise<Array<Record<string, unknown>>> };
      }
    )
      .withIndex("by_organization_local_id", (range) =>
        range.eq("organization_id", ORGANIZATION_A_ID),
      )
      .take(3);
    expect(rows.map((row) => row.local_id)).toEqual([
      "team_a_0000",
      "team_a_0001",
      "team_a_0002",
    ]);
  });

  it("lets an organization clear walk a reverse-inserted table without skipping rows", async () => {
    const context = with_schema_index_ordering(
      create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
        teams: descending_local_id_teams(),
      }),
    );
    await invoke_convex_handler(clear_table, context, { table_name: "teams" });
    await run_scheduled_clear_continuations(context, continue_sync_clear_job);
    expect(
      (context.tables.get("teams") ?? []).map((row) => row.organization_id),
    ).toEqual([ORGANIZATION_B_ID, ORGANIZATION_B_ID, ORGANIZATION_B_ID]);
    expect(context.tables.get("sync_tombstones")).toHaveLength(120);
  });

  it("pages the change feed in sync sequence order regardless of insertion order", async () => {
    const context = with_schema_index_ordering(
      create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
        teams: [5, 1, 3].map((sync_sequence) => ({
          ...sequenced_teams(`team_${sync_sequence}`, ORGANIZATION_A_ID, 1)[0],
          sync_sequence,
        })),
        sync_sequence_backfill_states: [
          {
            table_name: "teams",
            status: "complete",
            backfilled_count: 0,
            updated_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    const page = await invoke_convex_handler<{
      records: Array<{ sync_sequence: number }>;
      next_cursor: number;
    }>(get_changes_page, context, {
      table_name: "teams",
      after_sequence: 0,
      page_size: 2,
    });
    expect(page.records.map((row) => row.sync_sequence)).toEqual([1, 3]);
    expect(page.next_cursor).toBe(3);
  });
});
