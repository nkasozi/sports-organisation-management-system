import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import { create_login_sync_test_dependencies } from "./layoutLoginSync.test_support";

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: vi.fn(() => "Syncing Teams (1/4)"),
  scale_sync_percentage: vi.fn(() => 54),
  should_pull_org_from_server: vi.fn(() => true),
}));

describe("layoutLoginSync slow or failing devices", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stops waiting for an account pull that hangs", async () => {
    vi.useFakeTimers();
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    sync_now.mockReturnValueOnce(new Promise(() => {}));

    const pending = sync_verified_user_login_session(dependencies as never);
    await vi.advanceTimersByTimeAsync(120_000);

    expect((await pending).success).toBe(false);
    expect(dependencies.show_sync_retry).toHaveBeenCalledWith(
      "account_data_unavailable",
    );
  });

  it("offers a retry when the device cannot remember the completed sign-in", async () => {
    const { dependencies } = create_login_sync_test_dependencies();
    dependencies.initial_sync_store.complete_sync.mockResolvedValueOnce({
      success: false,
      error: "storage full",
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(false);
    expect(dependencies.show_sync_retry).toHaveBeenCalledWith(
      "session_not_saved",
    );
  });
});
