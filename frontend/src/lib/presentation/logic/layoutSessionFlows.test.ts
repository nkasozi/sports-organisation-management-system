import { describe, expect, it, vi } from "vitest";

import {
  handle_first_time_anonymous_user_session,
  handle_returning_anonymous_user_session,
  handle_verified_user_page_reload_session,
} from "./layoutSessionFlows";
import { create_login_dependencies } from "./layoutSessionFlows.test_support";

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
    expect(dependencies.start_realtime_sync).toHaveBeenCalled();
  });

  it("keeps first-time anonymous setup usable when the demo marker cannot be saved", async () => {
    const dependencies = create_login_dependencies();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    dependencies.initial_sync_store.complete_sync.mockResolvedValueOnce({
      success: false,
      error: "storage full",
    });

    const result = await handle_first_time_anonymous_user_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
  });
});
