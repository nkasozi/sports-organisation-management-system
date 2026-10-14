import { describe, expect, it, vi } from "vitest";

import { create_layout_login_sync_dependencies } from "./layoutSessionFlowDependencies";

describe("layoutSessionFlowDependencies", () => {
  it("adds get_state to the initial sync store while preserving the injected dependencies", () => {
    const initial_sync_state = { status: "syncing", current_step: 2 };
    const initial_sync_store = {
      start_sync: vi.fn(),
      update_progress: vi.fn(),
      complete_sync: vi.fn(async () => ({ success: true, data: true })),
      reset: vi.fn(),
    };
    const command = {
      initial_sync_store,
      get_initial_sync_state: vi.fn(() => initial_sync_state),
      auth_store: { kind: "auth-store" },
      sync_store: { kind: "sync-store" },
      stop_background_sync: vi.fn(),
      start_background_sync: vi.fn(),
      reset_database: vi.fn(),
      reset_sync_metadata: vi.fn(),
      look_up_current_user_profile: vi.fn(),
      set_pulling_from_remote: vi.fn(),
      write_convex_user_to_local_dexie: vi.fn(),
      pull_user_scoped_record_from_convex: vi.fn(),
      clear_session_sync_flag: vi.fn(),
      sign_out: vi.fn(),
      sign_out_and_tear_down_device: vi.fn(),
      show_session_notice: vi.fn(),
      goto: vi.fn(),
      delay: vi.fn(),
      get_unsynced_local_change_count: vi.fn(),
      confirm_discard_unsynced_local_changes: vi.fn(),
    };

    const dependencies = create_layout_login_sync_dependencies(
      command as never,
    );

    expect(dependencies.auth_store).toBe(command.auth_store);
    expect(dependencies.sync_store).toBe(command.sync_store);
    expect(dependencies.sign_out_and_tear_down_device).toBe(
      command.sign_out_and_tear_down_device,
    );
    expect(dependencies.show_session_notice).toBe(command.show_session_notice);
    expect(dependencies.initial_sync_store.start_sync).toBe(
      initial_sync_store.start_sync,
    );
    expect(dependencies.initial_sync_store.get_state()).toEqual(
      initial_sync_state,
    );
    expect(command.get_initial_sync_state).toHaveBeenCalledTimes(1);
  });
});
