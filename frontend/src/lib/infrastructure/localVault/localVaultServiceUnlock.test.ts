import { describe, expect, it } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_STATUS,
  type LocalVaultService,
  type PendingLocalVaultKey,
} from "./localVaultContracts";
import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import {
  create_local_vault_test_harness,
  expect_success,
  type LocalVaultTestHarness,
} from "./localVaultService.test_support";

async function activate_then_lock(
  harness: LocalVaultTestHarness,
  prepare: (
    service: LocalVaultService,
  ) => ReturnType<LocalVaultService["create_device_unlock"]>,
): Promise<PendingLocalVaultKey> {
  const pending = await prepare(harness.service);
  if (!pending.success) return expect.unreachable(pending.error);
  const activated = await harness.service.activate_pending_vault(pending.data);
  if (!activated.success) return expect.unreachable(activated.error);
  await expect_success(harness.service.lock());
  return pending.data;
}

function expect_remembered(
  harness: LocalVaultTestHarness,
  pending: PendingLocalVaultKey,
): void {
  expect(harness.key_holder.current()).toEqual({
    status: OptionStatus.SOME,
    value: pending.data_key,
  });
}

describe("unlocking the local vault", () => {
  it("reports no vault before one is set up", async () => {
    const harness = create_local_vault_test_harness();

    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.NO_VAULT,
    });
    expect(await harness.service.unlock_with_device_key()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.NO_VAULT,
    });
  });

  it("unlocks a device vault without any prompt", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await activate_then_lock(harness, (service) =>
      service.create_device_unlock(),
    );

    expect(await harness.service.read_status()).toEqual({
      kind: LOCAL_VAULT_STATUS.LOCKED,
      mode: LOCAL_VAULT_MODE.DEVICE,
    });
    const unlocked = await harness.service.unlock_with_device_key();

    expect(unlocked).toEqual({ success: true, data: LOCAL_VAULT_MODE.DEVICE });
    expect_remembered(harness, pending);
  });

  it("unlocks a device vault again after reopening the database", async () => {
    const first_harness = create_local_vault_test_harness();
    const pending = await activate_then_lock(first_harness, (service) =>
      service.create_device_unlock(),
    );
    const reopened = create_local_vault_test_harness(
      {},
      first_harness.database_name,
    );

    expect((await reopened.service.unlock_with_device_key()).success).toBe(
      true,
    );
    expect_remembered(reopened, pending);
  });

  it("unlocks a passkey vault with the same fingerprint", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await activate_then_lock(harness, (service) =>
      service.create_passkey_unlock("coach@example.com"),
    );

    const unlocked = await harness.service.unlock_with_passkey();

    expect(unlocked).toEqual({ success: true, data: LOCAL_VAULT_MODE.PASSKEY });
    expect_remembered(harness, pending);
  });

  it("refuses a passkey that returns a different PRF secret", async () => {
    const harness = create_local_vault_test_harness();
    await activate_then_lock(harness, (service) =>
      service.create_passkey_unlock("coach@example.com"),
    );
    const other_device = create_local_vault_test_harness(
      { device_seed: 99 },
      harness.database_name,
    );

    const unlocked = await other_device.service.unlock_with_passkey();

    expect(unlocked).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_WRONG_SECRET,
    });
    expect(other_device.key_holder.current().status).toBe(OptionStatus.NONE);
  });

  it("stays locked when the fingerprint prompt is cancelled", async () => {
    const harness = create_local_vault_test_harness();
    await activate_then_lock(harness, (service) =>
      service.create_passkey_unlock("coach@example.com"),
    );
    const cancelling = create_local_vault_test_harness(
      { cancel_requests: true },
      harness.database_name,
    );

    expect(await cancelling.service.unlock_with_passkey()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PASSKEY_CANCELLED,
    });
  });

  it("unlocks a PIN vault only with the right PIN", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await activate_then_lock(harness, (service) =>
      service.create_pin_unlock("246810"),
    );

    expect(await harness.service.unlock_with_pin("135790")).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.PIN_WRONG,
    });
    expect(harness.key_holder.current().status).toBe(OptionStatus.NONE);
    expect(await harness.service.unlock_with_pin("246810")).toEqual({
      success: true,
      data: LOCAL_VAULT_MODE.PIN,
    });
    expect_remembered(harness, pending);
  });

  it("refuses an unlock method that does not match the vault", async () => {
    const harness = create_local_vault_test_harness();
    await activate_then_lock(harness, (service) =>
      service.create_pin_unlock("246810"),
    );

    expect(await harness.service.unlock_with_device_key()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.WRONG_MODE_DEVICE,
    });
    expect(await harness.service.unlock_with_passkey()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.WRONG_MODE_PASSKEY,
    });
    expect(harness.device.get).not.toHaveBeenCalled();
  });
});
