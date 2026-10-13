import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  invoke_convex_handler,
  with_identity,
} from "./lib/fake_convex_context.test_support";
import {
  PARENT_REFERENCE_SPECS,
  type ParentScopedTable,
} from "./lib/parent_reference_specs";
import { PARENT_TABLE_ROWS } from "./lib/parent_scoped_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import {
  create_clear_context,
  run_scheduled_clear_continuations,
} from "./lib/sync_clear_job_fixtures.test_support";
import { list_parent_tables } from "./lib/sync_clear_table_order";
import { ALLOWED_SYNC_TABLES } from "./lib/sync_table_catalog";
import { clear_all_demo_data } from "./sync_admin_mutations";
import { get_changes_page } from "./sync_change_queries";
import { continue_sync_clear_job } from "./sync_clear_jobs";
import {
  DEMO_DATA_TABLE_NAMES,
  NON_DEMO_SYNC_TABLES,
} from "./sync_demo_tables";

const STAGE_A = {
  local_id: "stage_a",
  competition_id: "competition_a",
  name: "Pool A",
  stage_type: "group",
  version: 1,
  sync_sequence: 1,
};

describe("DEMO_DATA_TABLE_NAMES", () => {
  it("covers every sync table except the explicitly preserved ones", () => {
    expect([...DEMO_DATA_TABLE_NAMES].sort()).toEqual(
      ALLOWED_SYNC_TABLES.filter(
        (table_name) => !NON_DEMO_SYNC_TABLES.has(table_name),
      ).sort(),
    );
    expect(DEMO_DATA_TABLE_NAMES).toContain("competition_stages");
  });

  it("clears every parent scoped table before any of its parent tables", () => {
    for (const child_table of Object.keys(
      PARENT_REFERENCE_SPECS,
    ) as ParentScopedTable[]) {
      for (const parent_table of list_parent_tables(child_table))
        expect(
          DEMO_DATA_TABLE_NAMES.indexOf(child_table),
          `${child_table} before ${parent_table}`,
        ).toBeLessThan(DEMO_DATA_TABLE_NAMES.indexOf(parent_table));
    }
  });

  it("clears organizations last", () => {
    expect(DEMO_DATA_TABLE_NAMES[DEMO_DATA_TABLE_NAMES.length - 1]).toBe(
      "organizations",
    );
  });
});

describe("clear_all_demo_data ordering", () => {
  it("tombstones child stages while their competition still resolves the organization", async () => {
    const context = create_clear_context(SUPER_ADMIN_EMAIL, {
      competitions: PARENT_TABLE_ROWS.competitions.map((row, index) => ({
        ...row,
        sync_sequence: index + 1,
      })),
      competition_stages: [STAGE_A],
      sync_sequence_backfill_states: [
        {
          table_name: "competition_stages",
          status: "complete",
          backfilled_count: 0,
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
    await invoke_convex_handler(clear_all_demo_data, context, {});
    await run_scheduled_clear_continuations(context, continue_sync_clear_job);
    const page = await invoke_convex_handler<{
      tombstones: Array<{ local_id: string }>;
    }>(
      get_changes_page,
      with_identity(
        context,
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      ),
      { table_name: "competition_stages", after_sequence: 0 },
    );
    expect(page.tombstones.map((row) => row.local_id)).toEqual(["stage_a"]);
  });
});
