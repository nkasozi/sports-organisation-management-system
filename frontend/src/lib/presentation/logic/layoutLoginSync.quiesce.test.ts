import { describe, expect, it, vi } from "vitest";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import { create_login_sync_test_dependencies } from "./layoutLoginSync.test_support";

vi.mock("./layoutLogic", () => ({
  build_sync_progress_message: vi.fn(() => "Syncing"),
  scale_sync_percentage: vi.fn(() => 50),
  should_pull_org_from_server: vi.fn(() => true),
}));

describe("layoutLoginSync background sync teardown", () => {
  it("waits for in-flight sync work to settle before wiping the local database", async () => {
    const { dependencies, sync_now } = create_login_sync_test_dependencies();
    dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce({
      success: true,
      data: { organization_id: "organization-1", team_id: "team-1" },
    });
    sync_now
      .mockResolvedValueOnce({ success: true, errors: [] })
      .mockResolvedValueOnce({ success: true, errors: [] });
    const events: string[] = [];
    dependencies.stop_background_sync.mockImplementation(async () => {
      events.push("stop_requested");
      await new Promise((resolve) => setTimeout(resolve, 0));
      events.push("sync_idle");
      return true;
    });
    dependencies.reset_database.mockImplementation(async () => {
      events.push("reset_database");
      return true;
    });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result.success).toBe(true);
    expect(events).toEqual(["stop_requested", "sync_idle", "reset_database"]);
  });
});
