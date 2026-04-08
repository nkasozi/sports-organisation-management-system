import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { sync_verified_user_login_session } from "./layoutLoginSync";

describe("layoutLoginSync", () => {
  function create_dependencies() {
    const unsubscribe = vi.fn();
    const sync_now = vi.fn();
    const dependencies = {
      auth_store: {
        initialize: vi.fn().mockResolvedValue(undefined),
        reset_initialized_state: vi.fn(),
      },
      clear_session_sync_flag: vi.fn().mockResolvedValue(undefined),
      delay: vi.fn().mockResolvedValue(undefined),
      fetch_current_user_profile_from_convex: vi.fn(),
      goto: vi.fn().mockResolvedValue(undefined),
      initial_sync_store: {
        complete_sync: vi.fn().mockResolvedValue(undefined),
        get_state: vi.fn(() => ({ is_syncing: false })),
        reset: vi.fn(),
        start_sync: vi.fn(),
        update_progress: vi.fn(),
      },
      pull_user_scoped_record_from_convex: vi.fn().mockResolvedValue(undefined),
      reset_database: vi.fn().mockResolvedValue(undefined),
      reset_sync_metadata: vi.fn().mockResolvedValue(undefined),
      set_pulling_from_remote: vi.fn(),
      sign_out: vi.fn().mockResolvedValue(undefined),
      start_background_sync: vi.fn(),
      stop_background_sync: vi.fn(),
      sync_store: {
        subscribe: vi.fn(() => unsubscribe),
        sync_now,
      },
      write_convex_user_to_local_dexie: vi.fn().mockResolvedValue(undefined),
    };

    return { dependencies, sync_now, unsubscribe };
  }

  beforeEach(() => {
    build_sync_progress_message_mock.mockReset();
    scale_sync_percentage_mock.mockReset();
    should_pull_org_from_server_mock.mockReset();
    build_sync_progress_message_mock.mockReturnValue("Syncing Teams (1/4)");
    scale_sync_percentage_mock.mockReturnValue(54);
    should_pull_org_from_server_mock.mockReturnValue(true);
  });

  it("skips duplicate sync requests when an initial sync is already in progress", async () => {
    const { dependencies } = create_dependencies();
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
    const { dependencies } = create_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: true,
      data: null,
    });

    await expect(
      sync_verified_user_login_session(dependencies as never),
    ).resolves.toEqual({
      success: false,
      error: "No profile found for this account.",
    });
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.clear_session_sync_flag).toHaveBeenCalled();
    expect(dependencies.sign_out).toHaveBeenCalled();
    expect(dependencies.goto).toHaveBeenCalledWith("/unauthorized");
  });

  it("cleans up failed sync attempts and redirects back to sign-in", async () => {
    const { dependencies, sync_now, unsubscribe } = create_dependencies();
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
    expect(dependencies.goto).toHaveBeenCalledWith(
      "/sign-in?error=sync_failed",
    );
  });

  it("completes the verified-user sync flow and initializes the local auth state", async () => {
    const { dependencies, sync_now } = create_dependencies();
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
