import { beforeEach, describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import { create_login_sync_test_dependencies } from "./layoutLoginSync.test_support";

const {
  build_sync_progress_message_mock,
  scale_sync_percentage_mock,
  should_pull_org_from_server_mock,
} = vi.hoisted(() => ({
  build_sync_progress_message_mock: vi.fn(),
  scale_sync_percentage_mock: vi.fn(),
  should_pull_org_from_server_mock: vi.fn(),
}));

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: build_sync_progress_message_mock,
  scale_sync_percentage: scale_sync_percentage_mock,
  should_pull_org_from_server: should_pull_org_from_server_mock,
}));

describe("layoutLoginSync unsynced local changes", () => {
  beforeEach(() => {
    should_pull_org_from_server_mock.mockReturnValue(true);
  });

  it("does not wipe the local database when the user keeps unsynced changes", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.get_unsynced_local_change_count.mockResolvedValue({
      success: true,
      data: 3,
    });
    dependencies.confirm_discard_unsynced_local_changes.mockResolvedValue(
      false,
    );

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).toHaveBeenCalledWith(3);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
    expect(dependencies.stop_background_sync).not.toHaveBeenCalled();
    expect(dependencies.goto).toHaveBeenCalledWith(
      "/sign-in?error=unsynced_local_changes",
    );
  });

  it("keeps the session sync marker so the next load does not wipe the kept changes", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.get_unsynced_local_change_count.mockResolvedValue({
      success: true,
      data: 3,
    });
    dependencies.confirm_discard_unsynced_local_changes.mockResolvedValue(
      false,
    );

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(false);

    expect(dependencies.clear_session_sync_flag).not.toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.sign_out).toHaveBeenCalledTimes(1);
  });

  it("refuses to wipe when the outbox cannot be read and reports its own error code", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.get_unsynced_local_change_count.mockResolvedValue({
      success: false,
      error: "IndexedDB unavailable",
    } as never);

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.reset_database).not.toHaveBeenCalled();
    expect(dependencies.clear_session_sync_flag).not.toHaveBeenCalled();
    expect(
      dependencies.confirm_discard_unsynced_local_changes,
    ).not.toHaveBeenCalled();
    expect(dependencies.goto).toHaveBeenCalledWith(
      "/sign-in?error=local_changes_check_failed",
    );
  });

  it("continues with the wipe once the user confirms discarding the changes", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.get_unsynced_local_change_count.mockResolvedValue({
      success: true,
      data: 2,
    });
    dependencies.confirm_discard_unsynced_local_changes.mockResolvedValue(true);
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValue({
      success: false,
      error: "no profile",
    });

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(false);

    expect(dependencies.stop_background_sync).toHaveBeenCalled();
  });
});
