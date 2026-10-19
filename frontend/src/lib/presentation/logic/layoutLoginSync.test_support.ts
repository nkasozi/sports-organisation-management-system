import type { Mock } from "vitest";
import { vi } from "vitest";

import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

type InitialSyncStoreMock = {
  complete_sync: Mock;
  get_state: Mock;
  reset: Mock;
  start_sync: Mock;
  update_progress: Mock;
};

type LoginSyncTestDependencies = {
  auth_store: { initialize: Mock; reset_initialized_state: Mock };
  delay: Mock;
  look_up_current_user_profile: Mock;
  initial_sync_store: InitialSyncStoreMock;
  pull_user_scoped_record_from_convex: Mock;
  reset_database: Mock;
  protect_local_data_for_sign_in: Mock;
  activate_local_vault: Mock;
  reset_sync_metadata: Mock;
  set_pulling_from_remote: Mock;
  sign_out_and_tear_down_device: Mock;
  show_session_notice: Mock;
  show_sync_retry: Mock;
  dismiss_sync_retry: Mock;
  start_background_sync: Mock;
  start_realtime_sync: Mock;
  stop_background_sync: Mock;
  sync_store: { subscribe: Mock; sync_now: Mock };
  write_convex_user_to_local_dexie: Mock;
  get_unsynced_local_change_count: Mock;
};

function create_initial_sync_store_mock(): InitialSyncStoreMock {
  return {
    complete_sync: vi.fn(async () => create_success_result(true)),
    get_state: vi.fn(() => ({ is_syncing: false })),
    reset: vi.fn(),
    start_sync: vi.fn(),
    update_progress: vi.fn(),
  };
}

export function build_found_profile(
  profile: Record<string, string>,
): Record<string, unknown> {
  return { status: "found", profile };
}

export function create_login_sync_test_dependencies(): {
  dependencies: LoginSyncTestDependencies;
  sync_now: Mock;
  unsubscribe: Mock;
} {
  const unsubscribe = vi.fn();
  const sync_now = vi.fn(async () => ({ success: true, errors: [] }));
  const dependencies: LoginSyncTestDependencies = {
    auth_store: {
      initialize: vi.fn(async () => true),
      reset_initialized_state: vi.fn(),
    },
    delay: vi.fn(async () => {}),
    look_up_current_user_profile: vi.fn(async () => build_found_profile({})),
    initial_sync_store: create_initial_sync_store_mock(),
    pull_user_scoped_record_from_convex: vi.fn(async () => true),
    reset_database: vi.fn(async () => true),
    protect_local_data_for_sign_in: vi.fn(async () => ({
      kind: "protected",
      pending: { data_key: new Uint8Array(32), record: {} },
    })),
    activate_local_vault: vi.fn(async () => create_success_result("passkey")),
    reset_sync_metadata: vi.fn(async () => true),
    set_pulling_from_remote: vi.fn(),
    sign_out_and_tear_down_device: vi.fn(
      async (): AsyncResult<boolean> => create_success_result(true),
    ),
    show_session_notice: vi.fn(() => true),
    show_sync_retry: vi.fn(() => true),
    dismiss_sync_retry: vi.fn(() => true),
    start_background_sync: vi.fn(),
    start_realtime_sync: vi.fn(() => true),
    stop_background_sync: vi.fn(async () => true),
    sync_store: { subscribe: vi.fn(() => unsubscribe), sync_now },
    write_convex_user_to_local_dexie: vi.fn(async () => true),
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data: 0,
    })),
  };
  return { dependencies, sync_now, unsubscribe };
}
