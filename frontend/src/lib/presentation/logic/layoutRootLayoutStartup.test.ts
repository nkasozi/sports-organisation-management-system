import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import {
  ROOT_LAYOUT_STARTUP_OUTCOME,
  run_root_layout_session_action,
  run_root_layout_startup,
} from "./layoutRootLayoutStartup";

type SessionHandlersMock = {
  login_sync: Mock;
  verified_page_reload: Mock;
  first_time_anonymous: Mock;
  returning_anonymous: Mock;
};

function create_session_handlers(): SessionHandlersMock {
  return {
    login_sync: vi.fn(async () => true),
    verified_page_reload: vi.fn(async () => true),
    first_time_anonymous: vi.fn(async () => true),
    returning_anonymous: vi.fn(async () => true),
  };
}

function create_startup_command(
  overrides: Partial<Record<string, unknown>> = {},
): {
  command: {
    current_path: string;
    run_startup_storage_recovery: Mock;
    initialize_stores: Mock;
    subscribe_layout_state: Mock;
    has_session_been_synced: Mock;
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
    initialize_app_data: vi.fn(record("init", "success")),
    is_signed_in: vi.fn(() => true),
    session_handlers: create_session_handlers(),
    ...overrides,
  };
  return { command, call_order };
}

describe("run_root_layout_session_action", () => {
  it.each([
    ["login_sync", "login_sync"],
    ["verified_page_reload", "verified_page_reload"],
    ["first_time_anonymous", "first_time_anonymous"],
    ["returning_anonymous", "returning_anonymous"],
  ] as const)("dispatches %s to its handler", async (action, handler_name) => {
    const handlers = create_session_handlers();

    await run_root_layout_session_action(action, handlers);

    expect(handlers[handler_name]).toHaveBeenCalledTimes(1);
    const other_calls = Object.entries(handlers)
      .filter(([name]) => name !== handler_name)
      .map(([, handler]) => handler.mock.calls.length);
    expect(other_calls).toEqual([0, 0, 0]);
  });
});

describe("run_root_layout_startup", () => {
  it("runs recovery, store initialization and subscriptions before app init", async () => {
    const { command, call_order } = create_startup_command();

    const outcome = await run_root_layout_startup(command as never);

    expect(outcome).toBe(ROOT_LAYOUT_STARTUP_OUTCOME.READY);
    expect(call_order).toEqual([
      "recovery",
      "stores",
      "subscribe",
      "has_synced",
      "init",
    ]);
    expect(command.initialize_app_data).toHaveBeenCalledWith({
      current_path: "/teams",
      session_already_synced: false,
    });
    expect(command.session_handlers.login_sync).toHaveBeenCalled();
  });

  it("runs the verified page reload flow for an already synced session", async () => {
    const { command } = create_startup_command({
      has_session_been_synced: vi.fn(async () => true),
    });

    await run_root_layout_startup(command as never);

    expect(command.session_handlers.verified_page_reload).toHaveBeenCalled();
    expect(command.session_handlers.login_sync).not.toHaveBeenCalled();
  });

  it("stops before any session flow when the server is unavailable", async () => {
    const { command } = create_startup_command({
      initialize_app_data: vi.fn(async () => "redirect_to_login"),
    });

    const outcome = await run_root_layout_startup(command as never);

    expect(outcome).toBe(ROOT_LAYOUT_STARTUP_OUTCOME.SERVER_UNAVAILABLE);
    expect(
      Object.values(command.session_handlers).every(
        (handler) => handler.mock.calls.length === 0,
      ),
    ).toBe(true);
  });
});
