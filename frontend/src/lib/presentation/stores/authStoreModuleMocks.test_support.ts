import { expect, vi } from "vitest";

import { create_test_profiles } from "./authStoreTestProfiles.test_support";

type Unsubscribe = () => void;

type MockReadable<T> = {
  subscribe: (subscriber: (next_value: T) => void) => Unsubscribe;
};

export const mock_app_settings_store = {} as Record<string, string>;

export const mock_convex_query = vi.fn().mockResolvedValue({
  success: true,
  data: { email: "admin@test.com", role: "super_admin" },
});

export function create_container_module_mock(): Record<string, unknown> {
  return {
    get_app_settings_storage: () => ({
      get_setting: (key: string) =>
        Promise.resolve(mock_app_settings_store[key] ?? ""),
      set_setting: (key: string, value: string) => {
        mock_app_settings_store[key] = value;
        return Promise.resolve();
      },
      remove_setting: (key: string) => {
        delete mock_app_settings_store[key];
        return Promise.resolve();
      },
      clear_all_settings: () => {
        Object.keys(mock_app_settings_store).forEach(
          (k) => delete mock_app_settings_store[k],
        );
        return Promise.resolve();
      },
    }),
  };
}

export function create_convex_sync_service_module_mock(): Record<
  string,
  unknown
> {
  return {
    get_sync_manager: () => ({
      get_convex_client: () => ({
        query: mock_convex_query,
        mutation: vi.fn(),
      }),
    }),
    write_convex_user_to_local_dexie: vi
      .fn()
      .mockImplementation(async () => {}),
  };
}

function make_readable<T>(value: T): MockReadable<T> {
  return {
    subscribe: (subscriber: (next_value: T) => void): Unsubscribe => {
      subscriber(value);
      return () => {};
    },
  };
}

export function create_clerk_auth_service_module_mock(): Record<
  string,
  unknown
> {
  return {
    is_clerk_loaded: make_readable(true),
    is_signed_in: make_readable(true),
    clerk_session: make_readable({
      is_loaded: true,
      is_signed_in: true,
      user_state: {
        status: "present",
        user: { email_address: "admin@test.com" },
      },
      session_id_state: {
        status: "present",
        session_id: "test-session",
      },
    }),
  };
}

export function create_profile_loader_module_mock(): Record<string, unknown> {
  return {
    load_profiles_from_repository: vi.fn().mockImplementation(() => {
      return Promise.resolve(create_test_profiles());
    }),
  };
}

export function require_defined<T>(value: T | undefined): T {
  expect(value).toBeDefined();
  return value as T;
}
