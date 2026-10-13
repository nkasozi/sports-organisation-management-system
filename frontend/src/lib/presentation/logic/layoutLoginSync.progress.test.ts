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

describe("layoutLoginSync workspace and progress", () => {
  beforeEach(() => {
    build_sync_progress_message_mock.mockReset();
    scale_sync_percentage_mock.mockReset();
    should_pull_org_from_server_mock.mockReset();
    build_sync_progress_message_mock.mockReturnValue("Syncing Teams (1/4)");
    scale_sync_percentage_mock.mockReturnValue(54);
  });

  function arrange_successful_sync(
    profile: Record<string, string>,
  ): ReturnType<typeof create_login_sync_test_dependencies> {
    const arranged = create_login_sync_test_dependencies();
    arranged.dependencies.fetch_current_user_profile_from_convex.mockResolvedValueOnce(
      { success: true, data: profile },
    );
    arranged.sync_now.mockResolvedValue({ success: true, errors: [] });
    return arranged;
  }

  it("skips organisation and team pulls when the profile has neither", async () => {
    const { dependencies } = arrange_successful_sync({});

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(true);

    expect(should_pull_org_from_server_mock).not.toHaveBeenCalled();
    expect(
      dependencies.pull_user_scoped_record_from_convex,
    ).not.toHaveBeenCalled();
  });

  it("skips the organisation pull when the server copy is not needed", async () => {
    should_pull_org_from_server_mock.mockReturnValue(false);
    const { dependencies } = arrange_successful_sync({
      organization_id: "organization-1",
    });

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(true);

    expect(should_pull_org_from_server_mock).toHaveBeenCalledWith(
      "organization-1",
    );
    expect(
      dependencies.pull_user_scoped_record_from_convex,
    ).not.toHaveBeenCalled();
  });

  it("forwards active sync progress to the initial sync overlay and pulls twice", async () => {
    const { dependencies, sync_now, unsubscribe } = arrange_successful_sync({});
    dependencies.sync_store.subscribe.mockImplementation(((
      handler: (state: unknown) => void,
    ) => {
      handler({ current_progress: { status: "idle" } });
      handler({
        current_progress: {
          status: "active",
          progress: {
            table_name: "teams",
            tables_completed: 1,
            total_tables: 4,
            percentage: 25,
          },
        },
      });
      return unsubscribe;
    }) as never);

    const sync_verified_user_login_session_result =
      await sync_verified_user_login_session(dependencies as never);
    expect(sync_verified_user_login_session_result.success).toBe(true);

    expect(build_sync_progress_message_mock).toHaveBeenCalledWith(
      "teams",
      1,
      4,
    );
    expect(scale_sync_percentage_mock).toHaveBeenCalledWith(25);
    expect(
      dependencies.initial_sync_store.update_progress,
    ).toHaveBeenCalledWith("Syncing Teams (1/4)", 54);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(sync_now).toHaveBeenCalledTimes(2);
    expect(sync_now).toHaveBeenNthCalledWith(2, "pull");
  });

  it("treats a failed first pull without error details as success", async () => {
    const { dependencies, sync_now } = arrange_successful_sync({});
    sync_now.mockReset();
    sync_now.mockResolvedValue({ success: false, errors: [] });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result).toEqual({ success: true, data: true });
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
  });

  it("reports an unknown sync error when the first error has no message", async () => {
    const { dependencies, sync_now } = arrange_successful_sync({});
    sync_now.mockReset();
    sync_now.mockResolvedValue({ success: false, errors: [{ error: "" }] });

    const result = await sync_verified_user_login_session(
      dependencies as never,
    );

    expect(result).toEqual({
      success: false,
      error: "Sync failed: Unknown sync error",
    });
  });
});
