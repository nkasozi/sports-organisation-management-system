import { describe, expect, it, vi } from "vitest";

import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

import { sync_verified_user_login_session } from "./layoutLoginSync";
import {
  handle_first_time_anonymous_user_session,
  handle_returning_anonymous_user_session,
  handle_verified_user_page_reload_session,
} from "./layoutSessionFlows";

function create_initial_sync_store_mock(is_syncing: boolean = false) {
  return {
    start_sync: vi.fn(),
    update_progress: vi.fn(),
    complete_sync: vi.fn(async () => {}),
    reset: vi.fn(),
    get_state: vi.fn(() => ({ is_syncing })),
  };
}

function create_auth_store_mock() {
  return {
    reset_initialized_state: vi.fn(),
    initialize: vi.fn(async () => ({ success: true })),
  };
}

function create_sync_store_mock(sync_result: {
  success: boolean;
  errors: Array<{ error: string }>;
}) {
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

function create_login_dependencies(overrides: Record<string, unknown> = {}) {
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
    fetch_current_user_profile_from_convex: vi.fn(async () => ({
      success: true,
      data: { organization_id: "org_1", team_id: "team_1" },
    })),
    set_pulling_from_remote: vi.fn(),
    write_convex_user_to_local_dexie: vi.fn(async () => {}),
    pull_user_scoped_record_from_convex: vi.fn(async () => {}),
    clear_session_sync_flag: vi.fn(async () => {}),
    sign_out: vi.fn(async () => ({ success: true, data: true })),
    goto: vi.fn(async () => {}),
    delay: vi.fn(async () => {}),
    ...overrides,
  };
}

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
    expect(dependencies.sign_out).toHaveBeenCalled();
    expect(dependencies.goto).toHaveBeenCalledWith("/unauthorized");
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
    expect(dependencies.clear_session_sync_flag).toHaveBeenCalled();
    expect(dependencies.goto).toHaveBeenCalledWith(
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
