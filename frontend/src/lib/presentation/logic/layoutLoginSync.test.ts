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

describe("layoutLoginSync", () => {
  beforeEach(() => {
    build_sync_progress_message_mock.mockReset();
    scale_sync_percentage_mock.mockReset();
    should_pull_org_from_server_mock.mockReset();
    build_sync_progress_message_mock.mockReturnValue("Syncing Teams (1/4)");
    scale_sync_percentage_mock.mockReturnValue(54);
    should_pull_org_from_server_mock.mockReturnValue(true);
  });

  it("skips duplicate sync requests when an initial sync is already in progress", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.initial_sync_store.get_state.mockReturnValueOnce({
      is_syncing: true,
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: true,
      data: false,
    });
    expect(dependencies.initial_sync_store.start_sync).not.toHaveBeenCalled();
  });

  it("signs the user out and redirects to unauthorized when no profile is returned", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: false,
      error: "Profile not found in Convex",
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: false,
      error: "No profile found for this account.",
    });
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/unauthorized",
    );
    expect(dependencies.sign_out).not.toHaveBeenCalled();
    expect(dependencies.show_session_notice).not.toHaveBeenCalled();
  });

  it("surfaces a notice and stays signed in when the profile-not-found teardown fails", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: false,
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
    expect(dependencies.goto).not.toHaveBeenCalled();
  });

  it("cleans up failed sync attempts and redirects back to sign-in", async () => {
    const { dependencies, sync_now, unsubscribe } =
      create_login_sync_test_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: true,
      data: { organization_id: "organization-1", team_id: "team-1" },
    });
    sync_now.mockResolvedValueOnce({
      success: false,
      errors: [{ error: "network down" }],
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: false,
      error: "Sync failed: network down",
    });
    expect(unsubscribe).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/sign-in?error=sync_failed",
    );
    expect(dependencies.sign_out).not.toHaveBeenCalled();
  });

  it("completes the verified-user sync flow and initializes the local auth state", async () => {
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: true,
      data: { organization_id: "organization-1", team_id: "team-1" },
    });
    sync_now
      .mockResolvedValueOnce({ success: true, errors: [] })
      .mockResolvedValueOnce({ success: true, errors: [] });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: true,
      data: true,
    });

    expect(dependencies.stop_background_sync).toHaveBeenCalled();
    expect(dependencies.set_pulling_from_remote).toHaveBeenNthCalledWith(
      1,
      true,
    );
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
    expect(dependencies.set_pulling_from_remote).toHaveBeenNthCalledWith(
      2,
      false,
    );
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.auth_store.reset_initialized_state).toHaveBeenCalled();
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
  });
});
