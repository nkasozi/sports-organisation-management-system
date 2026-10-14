import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_TOKEN_RENEWAL_CHECK_INTERVAL_MS,
  type LocalTokenRenewalPorts,
  renew_local_token_if_due,
  start_local_token_renewal,
} from "./authSessionTokenRenewal";

const HOUR_MS = 60 * 60 * 1000;
const NOW_MS = 1_000_000_000_000;

function build_state(expires_at: number, is_demo_session = false): unknown {
  return {
    current_token: {
      status: "present",
      token: { payload: { expires_at }, raw_token: "a.b.c", signature: "c" },
    },
    is_demo_session,
    is_initialized: true,
  };
}

function create_ports(
  overrides: Partial<LocalTokenRenewalPorts> = {},
): LocalTokenRenewalPorts {
  return {
    read_auth_state: vi.fn(() => build_state(NOW_MS + 2 * HOUR_MS) as never),
    now: vi.fn(() => NOW_MS),
    renew_verified_session: vi.fn(async () => true),
    ...overrides,
  };
}

describe("renew_local_token_if_due", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("re-issues the verified user's token before it expires", async () => {
    const ports = create_ports();

    await expect(renew_local_token_if_due(ports)).resolves.toBe(true);
    expect(ports.renew_verified_session).toHaveBeenCalledTimes(1);
  });

  it("leaves a token with plenty of time left alone", async () => {
    const ports = create_ports({
      read_auth_state: vi.fn(() => build_state(NOW_MS + 72 * HOUR_MS) as never),
    });

    await expect(renew_local_token_if_due(ports)).resolves.toBe(false);
    expect(ports.renew_verified_session).not.toHaveBeenCalled();
  });

  it("does not renew demo sessions or missing tokens", async () => {
    const demo_ports = create_ports({
      read_auth_state: vi.fn(() => build_state(NOW_MS, true) as never),
    });
    const missing_ports = create_ports({
      read_auth_state: vi.fn(
        () =>
          ({
            current_token: { status: "missing" },
            is_demo_session: false,
          }) as never,
      ),
    });

    await expect(renew_local_token_if_due(demo_ports)).resolves.toBe(false);
    await expect(renew_local_token_if_due(missing_ports)).resolves.toBe(false);
  });
});

describe("start_local_token_renewal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks periodically until stopped", async () => {
    const ports = create_ports();
    const stop = start_local_token_renewal(ports);

    await vi.advanceTimersByTimeAsync(LOCAL_TOKEN_RENEWAL_CHECK_INTERVAL_MS);
    expect(ports.renew_verified_session).toHaveBeenCalledTimes(1);
    stop();
    await vi.advanceTimersByTimeAsync(LOCAL_TOKEN_RENEWAL_CHECK_INTERVAL_MS);
    expect(ports.renew_verified_session).toHaveBeenCalledTimes(1);
  });
});
