import type { Mock } from "vitest";
import { vi } from "vitest";

type SessionHandlersMock = {
  login_sync: Mock;
  verified_page_reload: Mock;
  first_time_anonymous: Mock;
  returning_anonymous: Mock;
  session_ended: Mock;
};

export function create_session_handlers(): SessionHandlersMock {
  return {
    login_sync: vi.fn(async () => true),
    verified_page_reload: vi.fn(async () => true),
    first_time_anonymous: vi.fn(async () => true),
    returning_anonymous: vi.fn(async () => true),
    session_ended: vi.fn(async () => true),
  };
}

export function create_startup_command(
  overrides: Partial<Record<string, unknown>> = {},
): {
  command: {
    current_path: string;
    run_startup_storage_recovery: Mock;
    initialize_stores: Mock;
    subscribe_layout_state: Mock;
    has_session_been_synced: Mock;
    resolve_current_device_session: Mock;
    complete_pending_clerk_sign_out: Mock;
    initialize_app_data: Mock;
    is_signed_in: Mock;
    session_handlers: SessionHandlersMock;
  };
  call_order: string[];
} {
  const call_order: string[] = [];
  const record =
    (name: string, value: unknown = true) =>
    async () => {
      call_order.push(name);
      return value;
    };
  const command = {
    current_path: "/teams",
    run_startup_storage_recovery: vi.fn(record("recovery")),
    initialize_stores: vi.fn(record("stores")),
    subscribe_layout_state: vi.fn(() => {
      call_order.push("subscribe");
      return true;
    }),
    has_session_been_synced: vi.fn(record("has_synced", false)),
    resolve_current_device_session: vi.fn(async () => ({
      status: "anonymous",
    })),
    complete_pending_clerk_sign_out: vi.fn(
      record("pending_sign_out", "none_pending"),
    ),
    initialize_app_data: vi.fn(record("init", "success")),
    is_signed_in: vi.fn(() => true),
    session_handlers: create_session_handlers(),
    ...overrides,
  };
  return { command, call_order };
}
