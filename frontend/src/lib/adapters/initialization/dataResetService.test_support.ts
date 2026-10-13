import { type Mock, vi } from "vitest";

export const reset_test_state = {
  is_signed_in: false,
  app_settings: {} as Record<string, string>,
};

export const clear_all_settings_mock = vi.fn(() => {
  Object.keys(reset_test_state.app_settings).forEach(
    (key) => delete reset_test_state.app_settings[key],
  );
  return Promise.resolve();
});

export function create_background_sync_mock(): Record<string, Mock> {
  return {
    stop_background_sync: vi.fn().mockReturnValue(true),
    start_background_sync: vi.fn().mockReturnValue(true),
    set_pulling_from_remote: vi.fn().mockReturnValue(true),
    reset_local_sync_bookkeeping: vi.fn().mockResolvedValue(true),
    enqueue_all_local_records_for_push: vi.fn().mockResolvedValue(0),
    pause_remote_change_subscriptions: vi.fn().mockReturnValue(true),
    resume_remote_change_subscriptions: vi.fn().mockReturnValue(true),
  };
}

interface SignedInStoreMock {
  is_signed_in: {
    subscribe(listener: (value: boolean) => void): () => boolean;
  };
}

export function create_signed_in_mock(): SignedInStoreMock {
  return {
    is_signed_in: {
      subscribe: (listener: (value: boolean) => void) => {
        listener(reset_test_state.is_signed_in);
        return () => true;
      },
    },
  };
}

export function create_container_mock(): {
  get_app_settings_storage(): Record<string, unknown>;
} {
  const settings = reset_test_state.app_settings;
  return {
    get_app_settings_storage: () => ({
      get_setting: (key: string) => Promise.resolve(settings[key] ?? ""),
      set_setting: (key: string, value: string) => {
        settings[key] = value;
        return Promise.resolve();
      },
      remove_setting: (key: string) => {
        delete settings[key];
        return Promise.resolve();
      },
      clear_all_settings: clear_all_settings_mock,
    }),
  };
}

export function prepare_reset_test(): boolean {
  vi.clearAllMocks();
  clear_all_settings_mock.mockClear();
  Object.keys(reset_test_state.app_settings).forEach(
    (key) => delete reset_test_state.app_settings[key],
  );
  reset_test_state.is_signed_in = false;
  (globalThis as Record<string, unknown>).window = globalThis;
  return true;
}
