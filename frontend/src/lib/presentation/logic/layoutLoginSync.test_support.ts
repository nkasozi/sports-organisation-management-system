import type { Mock } from "vitest";
import { vi } from "vitest";

import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

function create_initial_sync_store_mock(): InitialSyncStoreMock {
  return {
    complete_sync: vi.fn().mockImplementation(async () => {}),
    get_state: vi.fn(() => ({ is_syncing: false })),
    reset: vi.fn(),
    start_sync: vi.fn(),
    update_progress: vi.fn(),
  };
}

type InitialSyncStoreMock = {
  complete_sync: Mock;
  get_state: Mock;
  reset: Mock;
  start_sync: Mock;
  update_progress: Mock;
};

type LoginSyncTestDependencies = {
  auth_store: { initialize: Mock; reset_initialized_state: Mock };
  clear_session_sync_flag: Mock;
  delay: Mock;
  fetch_current_user_profile_from_convex: Mock;
  goto: Mock;
  initial_sync_store: InitialSyncStoreMock;
  pull_user_scoped_record_from_convex: Mock;
  reset_database: Mock;
  reset_sync_metadata: Mock;
  set_pulling_from_remote: Mock;
  sign_out: Mock;
  sign_out_and_tear_down_device: Mock;
  show_session_notice: Mock;
  start_background_sync: Mock;
  stop_background_sync: Mock;
  sync_store: { subscribe: Mock; sync_now: Mock };
  write_convex_user_to_local_dexie: Mock;
  get_unsynced_local_change_count: Mock;
  confirm_discard_unsynced_local_changes: Mock;
};

export function create_login_sync_test_dependencies(): {
  dependencies: LoginSyncTestDependencies;
  sync_now: Mock;
  unsubscribe: Mock;
} {
  const unsubscribe = vi.fn();
  const sync_now = vi.fn();
  const dependencies = {
    auth_store: {
      initialize: vi.fn().mockImplementation(async () => {}),
      reset_initialized_state: vi.fn(),
    },
    clear_session_sync_flag: vi.fn().mockImplementation(async () => {}),
    delay: vi.fn().mockImplementation(async () => {}),
    fetch_current_user_profile_from_convex: vi.fn(),
    goto: vi.fn().mockImplementation(async () => {}),
    initial_sync_store: create_initial_sync_store_mock(),
    pull_user_scoped_record_from_convex: vi
      .fn()
      .mockImplementation(async () => {}),
    reset_database: vi.fn().mockImplementation(async () => {}),
    reset_sync_metadata: vi.fn().mockImplementation(async () => {}),
    set_pulling_from_remote: vi.fn(),
    sign_out: vi.fn().mockImplementation(async () => {}),
    sign_out_and_tear_down_device: vi.fn(
      async (): AsyncResult<boolean> => create_success_result(true),
    ),
    show_session_notice: vi.fn(() => true),
    start_background_sync: vi.fn(),
    stop_background_sync: vi.fn(),
    sync_store: {
      subscribe: vi.fn(() => unsubscribe),
      sync_now,
    },
    write_convex_user_to_local_dexie: vi
      .fn()
      .mockImplementation(async () => {}),
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data: 0,
    })),
    confirm_discard_unsynced_local_changes: vi.fn(async () => false),
  };

  return { dependencies, sync_now, unsubscribe };
}
