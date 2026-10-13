import { writable } from "svelte/store";
import { vi } from "vitest";

export const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";
export const TABLE_CHANGE_MARKER_QUERY = "sync:get_table_change_marker";
export const SCOPED_ORGANIZATION_ID = "org_1";
export const ORGANIZATION_SETTINGS_SYNC_INTERVAL_MS = 45000;

export const app_initializer_test_state = {
  app_settings: {} as Record<string, string>,
  is_clerk_loaded: writable(true),
  is_signed_in: writable(false),
  convex_client: {
    mutation: vi.fn().mockResolvedValue(true),
    query: vi.fn().mockResolvedValue(true),
  },
  realtime_adapter: { stop: vi.fn(), start: vi.fn() },
  sync_orchestrator: { name: "sync_orchestrator" },
  organization_settings: { sync_interval_ms: 0 },
};

export const app_initializer_mocks = {
  initialize_clerk: vi.fn().mockResolvedValue(true),
  initialize_audit_event_handlers: vi.fn(),
  get_by_organization_id: vi.fn(),
  configure_orchestrator: vi.fn(),
  configure_remote_subscriber: vi.fn(),
  configure_restoration_handlers: vi.fn(),
  configure_scheduled_interval: vi.fn(),
  stop_background_sync: vi.fn(),
  start_realtime_sync: vi.fn(),
  stop_realtime_sync: vi.fn(),
  refresh_from_organization_settings: vi.fn(),
  get_current_org_id_state: vi.fn(),
  set_first_time: vi.fn(),
  start_setup: vi.fn(),
  update_progress: vi.fn(),
  initialize_convex_client: vi.fn(),
  start_auth_cache_invalidation: vi.fn(),
  stop_auth_cache_invalidation: vi.fn(),
  run_seeding_with_strategy: vi.fn(),
  initialize_all_use_cases: vi.fn(),
  is_seeding_already_complete: vi.fn(),
};

const mocks = app_initializer_mocks;
const state = app_initializer_test_state;

export const module_mocks = {
  api: {
    api: { sync: { get_table_change_marker: TABLE_CHANGE_MARKER_QUERY } },
  },
  clerk: {
    initialize_clerk: mocks.initialize_clerk,
    is_clerk_loaded: state.is_clerk_loaded,
    is_signed_in: state.is_signed_in,
  },
  container: {
    get_app_settings_storage: () => ({
      get_setting: (key: string) =>
        Promise.resolve(state.app_settings[key] ?? ""),
    }),
  },
  audit: {
    initialize_audit_event_handlers: mocks.initialize_audit_event_handlers,
  },
  use_case_factories: {
    get_organization_settings_use_cases: () => ({
      get_by_organization_id: mocks.get_by_organization_id,
    }),
  },
  background_sync: {
    configure_orchestrator: mocks.configure_orchestrator,
    configure_remote_subscriber: mocks.configure_remote_subscriber,
    configure_restoration_handlers: mocks.configure_restoration_handlers,
    configure_scheduled_interval: mocks.configure_scheduled_interval,
    stop_background_sync: mocks.stop_background_sync,
  },
  realtime_sync: {
    get_realtime_sync_adapter: () => state.realtime_adapter,
    start_realtime_sync: mocks.start_realtime_sync,
    stop_realtime_sync: mocks.stop_realtime_sync,
  },
  stores: {
    branding_store: {
      get_current_org_id_state: mocks.get_current_org_id_state,
      refresh_from_organization_settings:
        mocks.refresh_from_organization_settings,
    },
    first_time_setup_store: {
      set_first_time: mocks.set_first_time,
      start_setup: mocks.start_setup,
      update_progress: mocks.update_progress,
    },
    sync_store: { get_sync_orchestrator: () => state.sync_orchestrator },
  },
  convex_initializer: {
    initialize_convex_client: mocks.initialize_convex_client,
    start_auth_cache_invalidation: mocks.start_auth_cache_invalidation,
    stop_auth_cache_invalidation: mocks.stop_auth_cache_invalidation,
  },
  seeding_orchestrator: {
    run_seeding_with_strategy: mocks.run_seeding_with_strategy,
  },
  use_case_initializer: {
    initialize_all_use_cases: mocks.initialize_all_use_cases,
  },
  seeding_service: {
    is_seeding_already_complete: mocks.is_seeding_already_complete,
  },
};

export function prepare_app_initializer_test(): boolean {
  vi.clearAllMocks();
  Object.keys(state.app_settings).forEach(
    (key) => delete state.app_settings[key],
  );
  state.app_settings[FIRST_TIME_DETECTION_KEY] = "true";
  state.is_clerk_loaded.set(true);
  state.is_signed_in.set(false);
  state.organization_settings = {
    sync_interval_ms: ORGANIZATION_SETTINGS_SYNC_INTERVAL_MS,
  };
  mocks.initialize_convex_client.mockReturnValue({
    success: true,
    data: state.convex_client,
  });
  mocks.run_seeding_with_strategy.mockResolvedValue("success");
  mocks.is_seeding_already_complete.mockResolvedValue("complete");
  mocks.get_current_org_id_state.mockReturnValue({
    status: "scoped",
    organization_id: SCOPED_ORGANIZATION_ID,
  });
  mocks.get_by_organization_id.mockResolvedValue({
    success: true,
    data: state.organization_settings,
  });
  vi.stubGlobal("window", {});
  return true;
}

export function get_org_settings_pulled_handler(): (
  table_name: string,
) => Promise<void> {
  return mocks.start_realtime_sync.mock.calls[0][3];
}
