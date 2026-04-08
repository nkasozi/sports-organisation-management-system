import { describe, expect, it, vi } from "vitest";

const { get_remote_state_for_table_mock, verify_sync_auth_mock } = vi.hoisted(
  () => ({
    get_remote_state_for_table_mock: vi.fn(),
    verify_sync_auth_mock: vi.fn(),
  }),
);

vi.mock("./syncAuthUtils", () => ({
  verify_sync_auth: verify_sync_auth_mock,
}));

vi.mock("./syncDataAccess", () => ({
  get_remote_state_for_table: get_remote_state_for_table_mock,
}));

import {
  create_table_sync_progress,
  load_remote_table_state,
  log_sync_summary,
  update_table_sync_progress,
  verify_push_sync_auth_or_fail,
} from "./syncOrchestratorHelpers";

describe("syncOrchestratorHelpers", () => {
  it("verifies push auth and returns a failure result when unauthenticated", async () => {
    await expect(
      verify_push_sync_auth_or_fail({} as never, "pull", 100),
    ).resolves.toBeNull();

    verify_sync_auth_mock.mockResolvedValueOnce({ authenticated: true });
    await expect(
      verify_push_sync_auth_or_fail({} as never, "push", 100),
    ).resolves.toBeNull();

    verify_sync_auth_mock.mockResolvedValueOnce({
      authenticated: false,
      error: "token missing",
    });
    await expect(
      verify_push_sync_auth_or_fail({} as never, "push", 100),
    ).resolves.toMatchObject({
      success: false,
      errors: [
        {
          table_name: "auth_check",
          error: "Auth verification failed: token missing",
        },
      ],
    });
  });

  it("creates and updates table sync progress objects", () => {
    const initial_progress = create_table_sync_progress("teams", 2, 5);

    expect(initial_progress).toEqual({
      table_name: "teams",
      total_records: 0,
      synced_records: 0,
      status: "syncing",
      error_message: null,
      tables_completed: 2,
      total_tables: 5,
      percentage: 40,
    });

    expect(
      update_table_sync_progress(
        initial_progress,
        {
          records_pushed: 2,
          records_pulled: 3,
          conflicts: null,
          error: null,
        },
        3,
      ),
    ).toMatchObject({
      status: "success",
      synced_records: 5,
      tables_completed: 3,
      percentage: 60,
    });
  });

  it("loads remote table state and logs summaries", async () => {
    const console_log = vi.spyOn(console, "log").mockImplementation(() => {});
    const console_warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    get_remote_state_for_table_mock.mockResolvedValueOnce({ version: 3 });

    await expect(
      load_remote_table_state({} as never, "teams"),
    ).resolves.toEqual({
      state: { version: 3 },
      error_message: null,
    });

    get_remote_state_for_table_mock.mockRejectedValueOnce(new Error("network"));
    await expect(
      load_remote_table_state({} as never, "teams"),
    ).resolves.toEqual({
      state: null,
      error_message: "network",
    });

    log_sync_summary({
      sync_succeeded: false,
      duration_ms: 15,
      total_pushed: 2,
      total_pulled: 3,
      tables_synced: 1,
      total_tables: 4,
      errors: [{ table_name: "teams", error: "network" }],
      all_conflicts: [],
    });

    expect(console_log).toHaveBeenCalled();
    expect(console_warn).toHaveBeenCalled();
  });
});
