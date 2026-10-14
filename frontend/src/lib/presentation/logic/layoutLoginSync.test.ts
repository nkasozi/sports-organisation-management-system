import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import {
  build_found_profile,
  create_login_sync_test_dependencies,
} from "./layoutLoginSync.test_support";

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: vi.fn(() => "Syncing Teams (1/4)"),
  scale_sync_percentage: vi.fn(() => 54),
  should_pull_org_from_server: vi.fn(() => true),
}));

describe("layoutLoginSync", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("skips duplicate sync requests when an initial sync is already in progress", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.initial_sync_store.get_state.mockReturnValueOnce({
      is_syncing: true,
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({ success: true, data: false });
    expect(dependencies.initial_sync_store.start_sync).not.toHaveBeenCalled();
  });

  it("always wipes and pulls without pushing anything first", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.get_unsynced_local_change_count.mockResolvedValueOnce({
      success: true,
      data: 3,
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result).toEqual({ success: true, data: true });
    expect(dependencies.reset_database).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "login_discarded_pending_local_changes",
        discarded_change_count: 3,
      }),
    );
  });

  it("signs the user out and redirects to unauthorized when the server has no profile", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.look_up_current_user_profile.mockResolvedValueOnce({
      status: "not_found",
      error: "Profile not found in Convex",
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: false,
      error: "No profile found for this account.",
    });
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/unauthorized",
    );
    expect(dependencies.show_sync_retry).not.toHaveBeenCalled();
  });

  it("keeps the user signed in and offers a retry when the profile lookup cannot reach the server", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.look_up_current_user_profile.mockResolvedValueOnce({
      status: "unavailable",
      error: "timed_out",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.reset_database).not.toHaveBeenCalled();
    expect(dependencies.show_sync_retry).toHaveBeenCalledWith(
      "profile_unavailable",
    );
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
  });

  it("surfaces a notice and stays signed in when the profile-not-found teardown fails", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.look_up_current_user_profile.mockResolvedValueOnce({
      status: "not_found",
      error: "Profile not found in Convex",
    });
    dependencies.sign_out_and_tear_down_device.mockResolvedValueOnce({
      success: false,
      error: "reset failed",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.show_session_notice).toHaveBeenCalledWith(
      "sign_out_cleanup_failed",
    );
  });

  it("keeps the user signed in and offers a retry when the account pull fails", async () => {
    const { dependencies, sync_now, unsubscribe } =
      create_login_sync_test_dependencies();
    sync_now.mockResolvedValueOnce({
      success: false,
      errors: [{ error: "network down" }],
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({ success: false, error: "Sync failed: network down" });
    expect(unsubscribe).toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.show_sync_retry).toHaveBeenCalledWith(
      "account_data_unavailable",
    );
    expect(
      dependencies.initial_sync_store.complete_sync,
    ).not.toHaveBeenCalled();
  });

  it("completes the verified-user sync flow and starts live sync", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.look_up_current_user_profile.mockResolvedValueOnce(
      build_found_profile({
        organization_id: "organization-1",
        team_id: "team-1",
      }),
    );

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({ success: true, data: true });

    expect(dependencies.dismiss_sync_retry).toHaveBeenCalled();
    expect(dependencies.stop_background_sync).toHaveBeenCalled();
    expect(dependencies.reset_database).toHaveBeenCalled();
    expect(dependencies.reset_sync_metadata).toHaveBeenCalled();
    expect(dependencies.write_convex_user_to_local_dexie).toHaveBeenCalledWith({
      organization_id: "organization-1",
      team_id: "team-1",
    });
    expect(
      dependencies.pull_user_scoped_record_from_convex,
    ).toHaveBeenCalledWith("organizations", "organization-1");
    expect(
      dependencies.pull_user_scoped_record_from_convex,
    ).toHaveBeenCalledWith("teams", "team-1");
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.start_realtime_sync).toHaveBeenCalled();
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
  });
});
