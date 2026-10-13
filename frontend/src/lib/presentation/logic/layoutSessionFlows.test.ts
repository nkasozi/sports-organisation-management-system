import { describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import {
  handle_first_time_anonymous_user_session,
  handle_returning_anonymous_user_session,
  handle_verified_user_page_reload_session,
} from "./layoutSessionFlows";
import {
  create_login_dependencies,
  create_sync_store_mock,
} from "./layoutSessionFlows.test_support";

describe("layoutSessionFlows", () => {
  it("completes first-time anonymous setup", async () => {
    const dependencies = create_login_dependencies();

    const result = await handle_first_time_anonymous_user_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.initial_sync_store.start_sync).toHaveBeenCalled();
    expect(dependencies.reset_all_data).toHaveBeenCalled();
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
  });

  it("restores returning anonymous users without syncing", async () => {
    const dependencies = create_login_dependencies();

    const result = await handle_returning_anonymous_user_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.auth_store.reset_initialized_state).toHaveBeenCalled();
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.start_sync).not.toHaveBeenCalled();
  });

  it("restores verified users on reload and triggers a full sync", async () => {
    const dependencies = create_login_dependencies();

    const result = await handle_verified_user_page_reload_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.trigger_full_sync_on_page_reload).toHaveBeenCalled();
  });

  it("fails login sync when no profile is returned and redirects to unauthorized", async () => {
    const dependencies = create_login_dependencies({
      fetch_current_user_profile_from_convex: vi.fn(async () => ({
        success: false,
        error: "Profile not found in Convex",
      })),
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/unauthorized",
    );
  });

  it("fails login sync when the initial pull sync fails and redirects back to sign-in", async () => {
    const dependencies = create_login_dependencies({
      sync_store: create_sync_store_mock({
        success: false,
        errors: [{ error: "network" }],
      }),
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/sign-in?error=sync_failed",
    );
  });

  it("completes verified user login sync and restarts background sync", async () => {
    const dependencies = create_login_dependencies();

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(dependencies.write_convex_user_to_local_dexie).toHaveBeenCalled();
    expect(
      dependencies.pull_user_scoped_record_from_convex,
    ).toHaveBeenCalledTimes(2);
    expect(dependencies.start_background_sync).toHaveBeenCalled();
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
  });
});
