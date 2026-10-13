import { describe, expect, it } from "vitest";

import {
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import {
  type ClearJobResponse,
  create_clear_context,
  read_tombstone_ids,
  run_scheduled_clear_continuations,
  sequenced_teams,
} from "./lib/sync_clear_job_fixtures.test_support";
import { clear_all_demo_data } from "./sync_admin_mutations";
import { continue_sync_clear_job } from "./sync_clear_jobs";

const GENDER_ROW = {
  local_id: "gender_x",
  name: "Mixed",
  organization_id: "*",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
  sync_sequence: 1,
};

describe("clear_all_demo_data", () => {
  it("tombstones every demo record across tables so other devices drop them too", async () => {
    const context = create_clear_context(SUPER_ADMIN_EMAIL, {
      teams: [
        ...sequenced_teams("team_a", ORGANIZATION_A_ID, 1),
        ...sequenced_teams("team_b", ORGANIZATION_B_ID, 1),
      ],
      genders: [GENDER_ROW],
    });
    const result = await invoke_convex_handler<ClearJobResponse>(
      clear_all_demo_data,
      context,
      {},
    );
    await run_scheduled_clear_continuations(context, continue_sync_clear_job);
    expect(result.success).toBe(true);
    expect(find_table_rows(context, "teams")).toEqual([]);
    expect(find_table_rows(context, "genders")).toEqual([]);
    expect(read_tombstone_ids(context).sort()).toEqual([
      "gender_x",
      "team_a_0000",
      "team_b_0000",
    ]);
    expect(find_table_rows(context, "system_users").length).toBeGreaterThan(0);
  });

  it("denies callers without root-level delete permission", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: sequenced_teams("team_a", ORGANIZATION_A_ID, 1),
    });
    const result = await invoke_convex_handler<ClearJobResponse>(
      clear_all_demo_data,
      context,
      {},
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(1);
    expect(read_tombstone_ids(context)).toEqual([]);
  });
});
