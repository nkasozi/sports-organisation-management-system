import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import { handle_first_time_anonymous_user_session } from "./layoutSessionFlows";

function create_first_time_anonymous_dependencies(
  unsynced_count_result:
    | { success: true; data: number }
    | { success: false; error: string },
): {
  initial_sync_store: {
    start_sync: Mock;
    update_progress: Mock;
    complete_sync: Mock;
    reset: Mock;
  };
  auth_store: { reset_initialized_state: Mock; initialize: Mock };
  start_background_sync: Mock;
  reset_all_data: Mock;
  get_unsynced_local_change_count: Mock;
  show_session_notice: Mock;
} {
  return {
    initial_sync_store: {
      start_sync: vi.fn(),
      update_progress: vi.fn(),
      complete_sync: vi.fn(async () => ({ success: true, data: true })),
      reset: vi.fn(),
    },
    auth_store: {
      reset_initialized_state: vi.fn(),
      initialize: vi.fn(async () => ({ success: true })),
    },
    start_background_sync: vi.fn(() => true),
    reset_all_data: vi.fn(async () => {}),
    get_unsynced_local_change_count: vi.fn(async () => unsynced_count_result),
    show_session_notice: vi.fn(() => true),
  };
}

describe("handle_first_time_anonymous_user_session outbox protection", () => {
  it("resets local data when the outbox is empty", async () => {
    const dependencies = create_first_time_anonymous_dependencies({
      success: true,
      data: 0,
    });

    const result = await handle_first_time_anonymous_user_session(dependencies);

    expect(result).toEqual({ success: true, data: true });
    expect(dependencies.reset_all_data).toHaveBeenCalledTimes(1);
    expect(dependencies.initial_sync_store.complete_sync).toHaveBeenCalled();
    expect(dependencies.show_session_notice).not.toHaveBeenCalled();
  });

  it("never wipes unsynced local changes and tells the user why", async () => {
    const dependencies = create_first_time_anonymous_dependencies({
      success: true,
      data: 4,
    });

    const result = await handle_first_time_anonymous_user_session(dependencies);

    expect(result.success).toBe(false);
    expect(dependencies.reset_all_data).not.toHaveBeenCalled();
    expect(
      dependencies.initial_sync_store.complete_sync,
    ).not.toHaveBeenCalled();
    expect(dependencies.initial_sync_store.reset).toHaveBeenCalled();
    expect(dependencies.show_session_notice).toHaveBeenCalledWith(
      "local_changes_protected",
    );
    expect(dependencies.auth_store.initialize).toHaveBeenCalled();
  });

  it("blocks the reset when the outbox cannot be read", async () => {
    const dependencies = create_first_time_anonymous_dependencies({
      success: false,
      error: "IndexedDB unavailable",
    });

    const result = await handle_first_time_anonymous_user_session(dependencies);

    expect(result.success).toBe(false);
    expect(dependencies.reset_all_data).not.toHaveBeenCalled();
    expect(dependencies.show_session_notice).toHaveBeenCalledWith(
      "local_changes_check_failed",
    );
  });
});
