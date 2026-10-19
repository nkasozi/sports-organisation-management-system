import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { read_browser_passkey_platform } from "./browserPasskeyPlatform";
import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import { create_fake_passkey_device } from "./passkeyPrf.test_support";
import {
  check_passkey_prf_availability,
  create_passkey_prf_authenticator,
} from "./passkeyPrfAuthenticator";
import type { PasskeyCapabilityChecks } from "./passkeyPrfTypes";

function create_checks(
  has_platform_authenticator: boolean,
  capabilities: Record<string, boolean>,
): PasskeyCapabilityChecks {
  return {
    is_platform_authenticator_available: async () => has_platform_authenticator,
    read_client_capabilities: async () => capabilities,
  };
}

describe("fingerprint unlock availability", () => {
  it("is available with a platform authenticator not known to lack PRF", async () => {
    expect(await check_passkey_prf_availability(create_checks(true, {}))).toBe(
      true,
    );
    expect(
      await check_passkey_prf_availability(
        create_checks(true, { "extension:prf": true }),
      ),
    ).toBe(true);
  });

  it("is unavailable without a platform authenticator or PRF", async () => {
    expect(await check_passkey_prf_availability(create_checks(false, {}))).toBe(
      false,
    );
    expect(
      await check_passkey_prf_availability(
        create_checks(true, { "extension:prf": false }),
      ),
    ).toBe(false);
  });

  it("is unavailable when the capability check fails", async () => {
    const failing_checks: PasskeyCapabilityChecks = {
      is_platform_authenticator_available: () =>
        Promise.reject(new Error("blocked")),
      read_client_capabilities: async () => ({}),
    };

    expect(await check_passkey_prf_availability(failing_checks)).toBe(false);
  });

  it("is unavailable when the browser has no WebAuthn", async () => {
    const authenticator = create_passkey_prf_authenticator(() =>
      create_none_option(),
    );

    expect(await authenticator.is_available()).toBe(false);
    expect(read_browser_passkey_platform().status).toBe("none");
  });
});

describe("passkey PRF authenticator", () => {
  it("fails create and read with a friendly message when WebAuthn is missing", async () => {
    const authenticator = create_passkey_prf_authenticator(() =>
      create_none_option(),
    );

    const created = await authenticator.create_secret({
      relying_party_id: "localhost",
      owner_label: "coach@example.com",
    });

    expect(created).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE,
    });
  });

  it("creates and reads back the same secret through the injected platform", async () => {
    const device = create_fake_passkey_device();
    const authenticator = create_passkey_prf_authenticator(() =>
      create_some_option({
        credentials: device.credentials,
        capability_checks: create_checks(true, {}),
      }),
    );

    const created = await authenticator.create_secret({
      relying_party_id: "localhost",
      owner_label: "coach@example.com",
    });
    if (!created.success) return expect.unreachable(created.error);
    const read = await authenticator.read_secret(created.data);

    if (!read.success) return expect.unreachable(read.error);
    expect(read.data.secret).toEqual(created.data.secret);
    expect(await authenticator.is_available()).toBe(true);
  });
});
