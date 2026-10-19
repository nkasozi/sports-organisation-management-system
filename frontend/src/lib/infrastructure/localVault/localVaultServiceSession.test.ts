import { beforeEach, describe, expect, it, vi } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import { LOCAL_VAULT_MODE } from "./localVaultContracts";
import { LOCAL_VAULT_MESSAGE } from "./localVaultMessages";
import {
  create_local_vault_test_harness,
  expect_success,
} from "./localVaultService.test_support";
import {
  activate_pin_vault,
  move_clock,
  read_session_status,
  reload_page,
  TEST_PIN,
} from "./localVaultServiceSession.test_support";

describe("the unlock session across page loads", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("hands the same data key to a page opened soon after a PIN unlock", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await activate_pin_vault(harness);
    await expect_success(harness.service.lock());
    await expect_success(harness.service.unlock_with_pin(TEST_PIN));
    move_clock(harness, 1);
    const reloaded = reload_page(harness);

    expect(await reloaded.service.resume_unlock_session()).toEqual({
      success: true,
      data: LOCAL_VAULT_MODE.PIN,
    });
    expect(reloaded.key_holder.current()).toEqual({
      status: OptionStatus.SOME,
      value: pending.data_key,
    });
  });

  it("starts a session when a passkey vault is activated or unlocked", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await harness.service.create_passkey_unlock("coach");
    if (!pending.success) return expect.unreachable(pending.error);
    await expect_success(harness.service.activate_pending_vault(pending.data));
    const reloaded = reload_page(harness);

    expect(await reloaded.service.resume_unlock_session()).toEqual({
      success: true,
      data: LOCAL_VAULT_MODE.PASSKEY,
    });
    await expect_success(reloaded.service.lock());
    await expect_success(reloaded.service.unlock_with_passkey());

    expect(await read_session_status(reloaded)).toBe(OptionStatus.SOME);
  });

  it("refuses to resume when there is no vault", async () => {
    const harness = create_local_vault_test_harness();

    expect(await harness.service.resume_unlock_session()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.NO_VAULT,
    });
  });

  it("refuses to resume when the session was already ended", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);
    await expect_success(harness.service.end_unlock_session());
    const reloaded = reload_page(harness);

    expect(await reloaded.service.resume_unlock_session()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.NO_UNLOCK_SESSION,
    });
    expect(reloaded.key_holder.current().status).toBe(OptionStatus.NONE);
  });

  it("never resumes a session for a device vault", async () => {
    const harness = create_local_vault_test_harness();
    const pending = await harness.service.create_device_unlock();
    if (!pending.success) return expect.unreachable(pending.error);
    await expect_success(harness.service.activate_pending_vault(pending.data));

    expect(await reload_page(harness).service.resume_unlock_session()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.UNLOCK_SESSION_WRONG_MODE,
    });
  });

  it("forgets the session once the app was closed for more than five minutes", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);
    move_clock(harness, 6);
    const reloaded = reload_page(harness);

    expect(await reloaded.service.resume_unlock_session()).toEqual({
      success: false,
      error: LOCAL_VAULT_MESSAGE.UNLOCK_SESSION_EXPIRED,
    });
    expect(reloaded.key_holder.current().status).toBe(OptionStatus.NONE);
    expect(await read_session_status(reloaded)).toBe(OptionStatus.NONE);
  });

  it("forgets the session after thirty minutes open but out of sight", async () => {
    const harness = create_local_vault_test_harness();
    await activate_pin_vault(harness);
    move_clock(harness, 29);
    await expect_success(harness.service.beat_unlock_session(false));
    move_clock(harness, 31);
    const reloaded = reload_page(harness);

    expect((await reloaded.service.resume_unlock_session()).success).toBe(
      false,
    );
    expect(await read_session_status(reloaded)).toBe(OptionStatus.NONE);
  });
});
