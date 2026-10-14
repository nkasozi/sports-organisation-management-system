import type { Mock } from "vitest";
import { vi } from "vitest";

import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

type InitialSyncStoreMock = {
  start_sync: Mock;
  update_progress: Mock;
  complete_sync: Mock;
  reset: Mock;
  get_state: Mock;
};

type AuthStoreMock = { reset_initialized_state: Mock; initialize: Mock };

type SyncStoreMock = { subscribe: Mock; sync_now: Mock };

type LoginDependenciesMock = Record<string, unknown> & {
  initial_sync_store: InitialSyncStoreMock;
  auth_store: AuthStoreMock;
  sync_store: SyncStoreMock;
};

function create_initial_sync_store_mock(
  is_syncing: boolean = false,
): InitialSyncStoreMock {
  return {
    start_sync: vi.fn(),
    update_progress: vi.fn(),
    complete_sync: vi.fn(async () => ({ success: true, data: true })),
    reset: vi.fn(),
    get_state: vi.fn(() => ({ is_syncing })),
  };
}

function create_auth_store_mock(): AuthStoreMock {
  return {
    reset_initialized_state: vi.fn(),
    initialize: vi.fn(async () => ({ success: true })),
  };
}

function create_sync_store_mock(sync_result: {
  success: boolean;
  errors: Array<{ error: string }>;
}): SyncStoreMock {
  return {
    subscribe: vi.fn(
      (handler: (state: { current_progress: SyncProgressState }) => void) => {
        handler({
          current_progress: {
            status: "active",
            progress: {
              total_records: 1,
              synced_records: 1,
              status: "syncing",
              errors: [],
              table_name: "fixtures",
              tables_completed: 1,
              total_tables: 10,
              percentage: 50,
            },
          },
        });
        return () => {};
      },
    ),
    sync_now: vi.fn(async () => ({
      tables_synced: 1,
      records_pushed: 0,
      records_pulled: 1,
      duration_ms: 10,
      conflicts: [],
      ...sync_result,
    })),
  };
}

export function create_login_dependencies(
  overrides: Record<string, unknown> = {},
): LoginDependenciesMock {
  return {
    initial_sync_store: create_initial_sync_store_mock(),
    auth_store: create_auth_store_mock(),
    sync_store: create_sync_store_mock({ success: true, errors: [] }),
    stop_background_sync: vi.fn(),
    start_background_sync: vi.fn(),
    trigger_full_sync_on_page_reload: vi.fn(),
    reset_database: vi.fn(async () => {}),
    reset_sync_metadata: vi.fn(async () => {}),
    reset_all_data: vi.fn(async () => {}),
    start_realtime_sync: vi.fn(() => true),
    set_pulling_from_remote: vi.fn(),
    write_convex_user_to_local_dexie: vi.fn(async () => {}),
    pull_user_scoped_record_from_convex: vi.fn(async () => {}),
    clear_session_sync_flag: vi.fn(async () => {}),
    sign_out: vi.fn(async () => ({ success: true, data: true })),
    sign_out_and_tear_down_device: vi.fn(async () => ({
      success: true,
      data: true,
    })),
    show_session_notice: vi.fn(() => true),
    goto: vi.fn(async () => {}),
    delay: vi.fn(async () => {}),
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true,
      data: 0,
    })),
    ...overrides,
  };
}
