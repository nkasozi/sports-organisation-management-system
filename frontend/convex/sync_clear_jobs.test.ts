import { describe, expect, it } from "vitest";

import {
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ADMIN_EMAIL,
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
import { clear_table } from "./sync_admin_mutations";
import {
  continue_sync_clear_job,
  get_clear_job_status,
} from "./sync_clear_jobs";

describe("clear_table tombstones", () => {
  it("writes a tombstone and a new change sequence for every cleared record", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: [
        ...sequenced_teams("team_a", ORGANIZATION_A_ID, 2),
        ...sequenced_teams("team_b", ORGANIZATION_B_ID, 1),
      ],
      sync_change_sequences: [{ table_name: "teams", last_sequence: 3 }],
    });
    const result = await invoke_convex_handler<ClearJobResponse>(
      clear_table,
      context,
      { table_name: "teams" },
    );
    expect(result).toMatchObject({
      success: true,
      deleted_count: 2,
      job_status: "completed",
    });
    expect(read_tombstone_ids(context)).toEqual(["team_a_0000", "team_a_0001"]);
    expect(
      find_table_rows(context, "sync_tombstones").map(
        (row) => row.sync_sequence,
      ),
    ).toEqual([4, 5]);
    expect(
      find_table_rows(context, "teams").map((row) => row.local_id),
    ).toEqual(["team_b_0000"]);
  });

  it("continues large tables through scheduled jobs instead of truncating", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: sequenced_teams("team_a", ORGANIZATION_A_ID, 230),
      sync_change_sequences: [{ table_name: "teams", last_sequence: 230 }],
    });
    const first_slice = await invoke_convex_handler<ClearJobResponse>(
      clear_table,
      context,
      { table_name: "teams" },
    );
    expect(first_slice.job_status).toBe("running");
    expect(first_slice.deleted_count).toBeLessThan(230);
    const continuations = await run_scheduled_clear_continuations(
      context,
      continue_sync_clear_job,
    );
    expect(continuations).toBeGreaterThan(0);
    expect(find_table_rows(context, "teams")).toEqual([]);
    expect(read_tombstone_ids(context)).toHaveLength(230);
    const status = await invoke_convex_handler<{
      status: string;
      deleted_count: number;
    }>(get_clear_job_status, context, { job_id: first_slice.job_id });
    expect(status).toMatchObject({ status: "completed", deleted_count: 230 });
  });

  it("keeps records written after the clear was requested", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: sequenced_teams("team_a", ORGANIZATION_A_ID, 150),
      sync_change_sequences: [{ table_name: "teams", last_sequence: 150 }],
    });
    await invoke_convex_handler(clear_table, context, { table_name: "teams" });
    find_table_rows(context, "teams").push({
      ...sequenced_teams("team_z", ORGANIZATION_A_ID, 1)[0],
      _id: "teams_late_write",
      sync_sequence: 999,
    });
    await run_scheduled_clear_continuations(context, continue_sync_clear_job);
    expect(
      find_table_rows(context, "teams").map((row) => row.local_id),
    ).toEqual(["team_z_0000"]);
  });

  it("fails the job explicitly when its requester loses access mid-way", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: sequenced_teams("team_a", ORGANIZATION_A_ID, 150),
    });
    const first_slice = await invoke_convex_handler<ClearJobResponse>(
      clear_table,
      context,
      { table_name: "teams" },
    );
    const requester = find_table_rows(context, "system_users").find(
      (row) => row.email === ORGANIZATION_A_ADMIN_EMAIL,
    );
    Object.assign(requester ?? {}, { status: "inactive" });
    await run_scheduled_clear_continuations(context, continue_sync_clear_job);
    const job = find_table_rows(context, "sync_clear_jobs").find(
      (row) => row._id === first_slice.job_id,
    );
    expect(job).toMatchObject({ status: "failed" });
    expect(find_table_rows(context, "teams").length).toBeGreaterThan(0);
  });
});

describe("get_clear_job_status", () => {
  it("does not reveal a job to another organization", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: sequenced_teams("team_a", ORGANIZATION_A_ID, 1),
    });
    const result = await invoke_convex_handler<ClearJobResponse>(
      clear_table,
      context,
      { table_name: "teams" },
    );
    const other_context = create_clear_context(ORGANIZATION_B_ADMIN_EMAIL, {});
    other_context.tables.set(
      "sync_clear_jobs",
      find_table_rows(context, "sync_clear_jobs"),
    );
    const status = await invoke_convex_handler<{ status: string }>(
      get_clear_job_status,
      other_context,
      { job_id: result.job_id },
    );
    expect(status.status).toBe("not_found");
    const global_context = create_clear_context(SUPER_ADMIN_EMAIL, {});
    global_context.tables.set(
      "sync_clear_jobs",
      find_table_rows(context, "sync_clear_jobs"),
    );
    expect(
      (
        await invoke_convex_handler<{ status: string }>(
          get_clear_job_status,
          global_context,
          { job_id: result.job_id },
        )
      ).status,
    ).toBe("completed");
  });
});
