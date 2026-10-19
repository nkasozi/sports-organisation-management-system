import { describe, expect, it } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  LOCAL_DATA_KEY_LENGTH_BYTES,
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_STATUS,
} from "./localVaultContracts";
import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import {
  create_local_vault_test_harness,
  expect_success,
  TEST_NOW,
  TEST_PIN_ITERATIONS,
} from "./localVaultService.test_support";
import { FAKE_PRF_MODE } from "./passkeyPrf.test_support";

describe("preparing a new local vault", () => {
  it("prepares a device vault without saving or remembering it", async () => {
    const harness = create_local_vault_test_harness();

    const pending = await harness.service.create_device_unlock();

    if (!pending.success) return expect.unreachable(pending.error);
    expect(pending.data.data_key.length).toBe(LOCAL_DATA_KEY_LENGTH_BYTES);
    expect(pending.data.record.unlock.mode).toBe(LOCAL_VAULT_MODE.DEVICE);
    expect(pending.data.record.created_at).toBe(TEST_NOW.toISOString());
    expect(harness.key_holder.current().status).toBe(OptionStatus.NONE);
    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.NO_VAULT,
    });
  });

  it("activating a pending vault saves it and remembers its key", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await harness.service.create_device_unlock();
    if (!pending.success) return expect.unreachable(pending.error);

    const activated = await harness.service.activate_pending_vault(
      pending.data,
    );

    expect(activated).toEqual({ success: true, data: LOCAL_VAULT_MODE.DEVICE });
    expect(harness.key_holder.current()).toEqual({
      status: OptionStatus.SOME,
      value: pending.data.data_key,
    });
    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.UNLOCKED,
      mode: LOCAL_VAULT_MODE.DEVICE,
    });
  });

  it("each new vault gets a new data key that replaces the old vault", async () => {
    const harness = create_local_vault_test_harness();
    const first = await harness.service.create_device_unlock();
    const second = await harness.service.create_pin_unlock("246810");
    if (!first.success || !second.success)
      return expect.unreachable("vaults should be prepared");

    const first_activation = await harness.service.activate_pending_vault(
      first.data,
    );
    const second_activation = await harness.service.activate_pending_vault(
      second.data,
    );
    await expect_success(harness.service.lock());

    expect(first_activation.success && second_activation.success).toBe(true);
    expect(first.data.data_key).not.toEqual(second.data.data_key);
    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.LOCKED,
      mode: LOCAL_VAULT_MODE.PIN,
    });
  });

  it("prepares a passkey vault named after its owner", async () => {
    const harness = create_local_vault_test_harness();

    const pending =
      await harness.service.create_passkey_unlock("coach@example.com");

    if (!pending.success) return expect.unreachable(pending.error);
    expect(pending.data.record.unlock.mode).toBe(LOCAL_VAULT_MODE.PASSKEY);
    const options = harness.device.create.mock
      .calls[0][0] as CredentialCreationOptions;
    expect(options.publicKey?.user.name).toBe("coach@example.com");
    expect(options.publicKey?.rp.id).toBe("localhost");
  });

  it("fails passkey setup with a friendly message when cancelled", async () => {
    const harness = create_local_vault_test_harness({ cancel_requests: true });

    const pending =
      await harness.service.create_passkey_unlock("coach@example.com");

    expect(pending).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_CANCELLED,
    });
  });

  it("fails passkey setup on devices without PRF and points to a PIN", async () => {
    const harness = create_local_vault_test_harness({
      prf_mode: FAKE_PRF_MODE.UNSUPPORTED,
    });

    const pending =
      await harness.service.create_passkey_unlock("coach@example.com");

    expect(pending).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE,
    });
  });

  it("prepares a PIN vault with a random salt and the configured iterations", async () => {
    const harness = create_local_vault_test_harness();

    const pending = await harness.service.create_pin_unlock("246810");

    if (!pending.success) return expect.unreachable(pending.error);
    const unlock = pending.data.record.unlock;
    if (unlock.mode !== LOCAL_VAULT_MODE.PIN)
      return expect.unreachable("mode should be PIN");
    expect(unlock.pin_salt.length).toBe(16);
    expect(unlock.pin_iterations).toBe(TEST_PIN_ITERATIONS);
  });

  it("rejects a PIN shorter than six characters", async () => {
    const harness = create_local_vault_test_harness();

    const pending = await harness.service.create_pin_unlock("12345");

    expect(pending).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PIN_TOO_SHORT,
    });
  });

  it("reports whether fingerprint unlock is available", async () => {
    const harness = create_local_vault_test_harness();

    expect(await harness.service.is_passkey_unlock_available()).toBe(true);
  });
});
