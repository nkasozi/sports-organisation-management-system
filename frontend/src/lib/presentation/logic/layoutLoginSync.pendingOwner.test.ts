import { beforeEach, describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import { create_login_sync_test_dependencies } from "./layoutLoginSync.test_support";

const { should_pull_org_from_server_mock } = vi.hoisted(() => ({
  should_pull_org_from_server_mock: vi.fn(),
}));

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: vi.fn(),
  scale_sync_percentage: vi.fn(),
  should_pull_org_from_server: should_pull_org_from_server_mock,
}));

const SAME_USER_SYNC_STATE = {
  status: "verified_user",
  session_id: "session-ended",
  user_id: "user-current",
};

function create_dependencies_with_pending_changes(
  unsynced_counts: number[],
): ReturnType<typeof create_login_sync_test_dependencies>["dependencies"] {
  const { dependencies, sync_now } = create_login_sync_test_dependencies();
  const counts = [...unsynced_counts];
  dependencies.get_unsynced_local_change_count.mockImplementation(async () => ({
    success: true,
    data: counts.length > 1 ? (counts.shift() ?? 0) : (counts[0] ?? 0),
  }));
  dependencies.fetch_current_user_profile_from_convex.mockResolvedValue({
    success: true,
    data: { id: "profile-1", organization_id: "", team_id: "" },
  });
  sync_now.mockResolvedValue({ success: true, errors: [] });
  return dependencies;
}

describe("layoutLoginSync pending changes owned by someone", () => {
  beforeEach(() => {
    should_pull_org_from_server_mock.mockReturnValue(false);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("pushes the same user's pending changes before replacing local data", async () => {
    const dependencies = create_dependencies_with_pending_changes([3, 0]);
    dependencies.read_session_sync_state.mockResolvedValue(
      SAME_USER_SYNC_STATE,
    );
    const call_order: string[] = [];
    dependencies.flush_pending_changes.mockImplementation(async () => {
      call_order.push("flush");
      return { success: true, data: { skipped_offline: false } };
    });
    dependencies.reset_database.mockImplementation(async () => {
      call_order.push("reset_database");
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(call_order).toEqual(["flush", "reset_database"]);
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).not.toHaveBeenCalled();
  });

  it("asks before discarding the same user's changes that could not be pushed", async () => {
    const dependencies = create_dependencies_with_pending_changes([3, 2]);
    dependencies.read_session_sync_state.mockResolvedValue(
      SAME_USER_SYNC_STATE,
    );
    dependencies.flush_pending_changes.mockResolvedValue({
      success: false,
      error: "2 changes still unsynced",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).toHaveBeenCalledWith(2);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
  });

  it("overwrites anonymous demo changes without asking and logs it", async () => {
    const dependencies = create_dependencies_with_pending_changes([4]);
    dependencies.read_session_sync_state.mockResolvedValue({
      status: "anonymous",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.flush_pending_changes).not.toHaveBeenCalled();
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).not.toHaveBeenCalled();
    expect(dependencies.reset_database).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "login_demo_changes_overwritten",
        unsynced_count: 4,
      }),
    );
  });

  it("never pushes another account's changes under the new user", async () => {
    const dependencies = create_dependencies_with_pending_changes([2]);
    dependencies.confirm_discard_unsynced_local_changes.mockResolvedValue(true);

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.flush_pending_changes).not.toHaveBeenCalled();
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).toHaveBeenCalledWith(2);
    expect(dependencies.reset_database).toHaveBeenCalledTimes(1);
  });
});
