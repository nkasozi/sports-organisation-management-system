import { beforeEach, describe, expect, it, vi } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";
import { create_failure_result } from "$lib/core/types/Result";

import { LOCAL_VAULT_MODE } from "./localVaultContracts";
import { create_local_vault_service } from "./localVaultService";
import {
  create_local_vault_test_harness,
  expect_success,
  TEST_PIN_ITERATIONS,
} from "./localVaultService.test_support";
import {
  activate_pin_vault,
  move_clock,
  read_session_status,
  reload_page,
} from "./localVaultServiceSession.test_support";

describe("the unlock session heartbeat", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("keeps going while in sight and ends everywhere after too long away", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);

    move_clock(harness, 20);
    expect(await harness.service.beat_unlock_session(true)).toEqual({
      success: true,
      data: true,
    });
    move_clock(harness, 45);
    expect(await harness.service.beat_unlock_session(false)).toEqual({
      success: true,
      data: true,
    });
    move_clock(harness, 51);
    expect(await harness.service.beat_unlock_session(false)).toEqual({
      success: true,
      data: false,
    });
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
    expect(harness.announced_session_endings).toHaveLength(1);
    expect(harness.service.has_unlock_session()).toBe(false);
  });

  it("ends a tab whose session was ended in another tab", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);
    await expect_success(harness.unlock_session_storage.delete_record());

    expect(await harness.service.beat_unlock_session(true)).toEqual({
      success: true,
      data: false,
    });
  });

  it("never stores a session for a device vault", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await harness.service.create_device_unlock();
    if (!pending.success) return expect.unreachable(pending.error);
    await expect_success(harness.service.activate_pending_vault(pending.data));
    move_clock(harness, 120);

    expect(await harness.service.beat_unlock_session(false)).toEqual({
      success: true,
      data: true,
    });
    expect(harness.service.has_unlock_session()).toBe(false);
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
  });
});

describe("ending the unlock session", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("ends the session when a device vault replaces a protected one", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);
    expect(harness.service.has_unlock_session()).toBe(true);
    const device = await harness.service.create_device_unlock();
    if (!device.success) return expect.unreachable(device.error);
    await expect_success(harness.service.activate_pending_vault(device.data));

    expect(harness.service.has_unlock_session()).toBe(false);
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
    expect(harness.announced_session_endings).toHaveLength(1);
  });

  it("ends the session when the vault is locked", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);

    expect(await harness.service.lock()).toEqual({
      success: true,
      data: true,
    });
    expect(harness.key_holder.current().status).toBe(OptionStatus.NONE);
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
    expect(
      (await reload_page(harness).service.resume_unlock_session()).success,
    ).toBe(false);
  });

  it("ends the session on request", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);

    expect(await harness.service.end_unlock_session()).toEqual({
      success: true,
      data: true,
    });
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
    expect(harness.service.has_unlock_session()).toBe(false);
  });
});

describe("an unlock session that cannot be saved", () => {
  it("keeps the unlock and simply asks again on the next page load", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const harness = create_local_vault_test_harness();
    const service = create_local_vault_service({
      storage: harness.storage,
      unlock_session_storage: {
        ...harness.unlock_session_storage,
        save_record: async () => create_failure_result("disk full"),
      },
      announce_unlock_session_ended: () => true,
      key_holder: harness.key_holder,
      passkey_authenticator: {} as never,
      read_relying_party_id: () => "localhost",
      read_current_time: () => harness.clock.now,
      pin_iterations: TEST_PIN_ITERATIONS,
    });
    const pending = await service.create_pin_unlock("246810");
    if (!pending.success) return expect.unreachable(pending.error);

    expect(await service.activate_pending_vault(pending.data)).toEqual({
      success: true,
      data: LOCAL_VAULT_MODE.PIN,
    });
    expect(service.has_unlock_session()).toBe(false);
    expect(await read_session_status(harness)).toBe(OptionStatus.NONE);
  });
});
