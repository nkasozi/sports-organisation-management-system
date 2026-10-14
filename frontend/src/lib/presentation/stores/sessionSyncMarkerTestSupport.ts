import { vi } from "vitest";

import type { ClerkSessionState } from "$lib/adapters/iam/clerkAuthTypes";

export const SESSION_SYNC_KEY = "sports_org_session_synced";
export const ANONYMOUS_SESSION_SYNC_MARKER = JSON.stringify({
  mode: "anonymous",
});

const signed_out_clerk_state: ClerkSessionState = {
  is_loaded: true,
  is_signed_in: false,
  user_state: { status: "missing" },
  session_id_state: { status: "missing" },
};

const mock_clerk_state: { current: ClerkSessionState } = {
  current: signed_out_clerk_state,
};
const mock_clerk_reachability: { current: { status: string } } = {
  current: { status: "confirmed" },
};

export function set_clerk_reachability(status: string): boolean {
  mock_clerk_reachability.current = { status };
  return true;
}
export const mock_app_settings_store: Record<string, string> = {};
export const mock_app_settings_write_failure: { enabled: boolean } = {
  enabled: false,
};
export const mock_initialize_clerk = vi.fn(async () => true);

export function build_legacy_verified_session_sync_marker(
  session_id: string,
): string {
  return JSON.stringify({ mode: "verified", session_id });
}

export function build_verified_user_session_sync_marker(
  session_id: string,
  user_id: string,
): string {
  return JSON.stringify({ mode: "verified_user", session_id, user_id });
}

function set_signed_out_clerk_session_state(): boolean {
  mock_clerk_state.current = signed_out_clerk_state;
  return true;
}

export function set_signed_in_clerk_session_state(
  session_id: string,
  user_id: string,
): boolean {
  mock_clerk_state.current = {
    is_loaded: true,
    is_signed_in: true,
    user_state: {
      status: "present",
      user: {
        id: user_id,
        email_address: "",
        full_name: "",
        first_name: "",
        last_name: "",
      },
    },
    session_id_state: { status: "present", session_id },
  };
  return true;
}

export function set_signed_in_without_loaded_user(session_id: string): boolean {
  mock_clerk_state.current = {
    ...signed_out_clerk_state,
    is_signed_in: true,
    session_id_state: { status: "present", session_id },
  };
  return true;
}

export function reset_session_sync_test_state(): boolean {
  Object.keys(mock_app_settings_store).forEach(
    (key) => delete mock_app_settings_store[key],
  );
  mock_initialize_clerk.mockClear();
  mock_app_settings_write_failure.enabled = false;
  set_clerk_reachability("confirmed");
  return set_signed_out_clerk_session_state();
}

export function create_clerk_auth_service_mock(): {
  clerk_session: {
    subscribe: (callback: (value: unknown) => void) => () => void;
  };
  initialize_clerk: typeof mock_initialize_clerk;
  get_clerk_reachability: () => { status: string };
} {
  return {
    clerk_session: {
      subscribe: (callback: (value: unknown) => void) => {
        callback(mock_clerk_state.current);
        return (): void => {};
      },
    },
    initialize_clerk: mock_initialize_clerk,
    get_clerk_reachability: () => mock_clerk_reachability.current,
  };
}

interface AppSettingsStorageMock {
  get_setting: (key: string) => Promise<string>;
  set_setting: (key: string, value: string) => Promise<void>;
  remove_setting: (key: string) => Promise<void>;
}

export function create_app_settings_container_mock(): {
  get_app_settings_storage: () => AppSettingsStorageMock;
} {
  return {
    get_app_settings_storage: () => ({
      get_setting: (key: string) =>
        Promise.resolve(mock_app_settings_store[key] ?? ""),
      set_setting: (key: string, value: string) => {
        if (mock_app_settings_write_failure.enabled)
          return Promise.reject(new Error("QuotaExceededError"));
        mock_app_settings_store[key] = value;
        return Promise.resolve();
      },
      remove_setting: (key: string) => {
        delete mock_app_settings_store[key];
        return Promise.resolve();
      },
    }),
  };
}
