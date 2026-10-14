import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_clerk_confirmation_tracker,
  reconnect_device_session,
  SESSION_RECONNECT_OUTCOME,
  type SessionReconnectPorts,
  should_retry_clerk_in_background,
} from "./layoutSessionReconnect";

function create_ports(
  overrides: Partial<SessionReconnectPorts> = {},
): SessionReconnectPorts {
  return {
    is_browser_online: vi.fn(() => true),
    is_clerk_ready: vi.fn(() => false),
    complete_pending_clerk_sign_out: vi.fn(async () => "none_pending" as const),
    retry_clerk_initialization: vi.fn(async () => true),
    is_signed_in: vi.fn(() => true),
    ensure_signed_in_sync: vi.fn(() => true),
    check_signed_out_device: vi.fn(async () => true),
    ...overrides,
  };
}

describe("reconnect_device_session", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("does nothing while the browser is offline", async () => {
    const ports = create_ports({ is_browser_online: vi.fn(() => false) });

    await expect(reconnect_device_session(ports)).resolves.toBe(
      SESSION_RECONNECT_OUTCOME.STILL_OFFLINE,
    );
    expect(ports.retry_clerk_initialization).not.toHaveBeenCalled();
  });

  it("finishes a pending sign-out before touching the account", async () => {
    const ports = create_ports({
      complete_pending_clerk_sign_out: vi.fn(async () => "completed" as const),
    });

    await expect(reconnect_device_session(ports)).resolves.toBe(
      SESSION_RECONNECT_OUTCOME.SIGN_OUT_PENDING,
    );
    expect(ports.ensure_signed_in_sync).not.toHaveBeenCalled();
    expect(ports.check_signed_out_device).not.toHaveBeenCalled();
  });

  it("restarts Clerk and resumes syncing for a signed-in user", async () => {
    const ports = create_ports();

    await expect(reconnect_device_session(ports)).resolves.toBe(
      SESSION_RECONNECT_OUTCOME.SYNC_RESUMED,
    );
    expect(ports.retry_clerk_initialization).toHaveBeenCalledTimes(1);
    expect(ports.ensure_signed_in_sync).toHaveBeenCalledTimes(1);
  });

  it("checks whether the session ended when Clerk reports no session", async () => {
    const ports = create_ports({ is_signed_in: vi.fn(() => false) });

    await expect(reconnect_device_session(ports)).resolves.toBe(
      SESSION_RECONNECT_OUTCOME.SIGNED_OUT_CHECKED,
    );
    expect(ports.check_signed_out_device).toHaveBeenCalledTimes(1);
  });
});

describe("should_retry_clerk_in_background", () => {
  it("retries only when online and Clerk has not started", () => {
    expect(should_retry_clerk_in_background(create_ports())).toBe(true);
    expect(
      should_retry_clerk_in_background(
        create_ports({ is_clerk_ready: vi.fn(() => true) }),
      ),
    ).toBe(false);
    expect(
      should_retry_clerk_in_background(
        create_ports({ is_browser_online: vi.fn(() => false) }),
      ),
    ).toBe(false);
  });
});

describe("create_clerk_confirmation_tracker", () => {
  it("reports only the moment Clerk becomes confirmed", () => {
    const tracker = create_clerk_confirmation_tracker("pending");

    expect(tracker.has_just_confirmed("unreachable")).toBe(false);
    expect(tracker.has_just_confirmed("confirmed")).toBe(true);
    expect(tracker.has_just_confirmed("confirmed")).toBe(false);
    expect(tracker.has_just_confirmed("pending")).toBe(false);
    expect(tracker.has_just_confirmed("confirmed")).toBe(true);
  });

  it("ignores a Clerk that was already confirmed when watching started", () => {
    const tracker = create_clerk_confirmation_tracker("confirmed");

    expect(tracker.has_just_confirmed("confirmed")).toBe(false);
  });
});
