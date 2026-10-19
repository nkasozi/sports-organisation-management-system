import { describe, expect, it } from "vitest";

import { LOCAL_DATA_KEY_LENGTH_BYTES } from "./localVaultContracts";
import {
  generate_local_data_key,
  unwrap_local_data_key,
  wrap_local_data_key,
} from "./localVaultKeyCrypto";
import {
  create_device_wrapping_key,
  derive_wrapping_key_from_passkey_secret,
  derive_wrapping_key_from_pin,
  PIN_KEY_ITERATIONS,
  validate_local_vault_pin,
} from "./localVaultWrappingKeys";

const TEST_PIN_ITERATIONS = 1000;

async function require_key(
  key_result: Awaited<ReturnType<typeof create_device_wrapping_key>>,
): Promise<CryptoKey> {
  if (!key_result.success) return expect.unreachable(key_result.error);
  return key_result.data;
}

describe("local data key crypto", () => {
  it("generates a fresh random 32-byte data key each time", () => {
    const first_key = generate_local_data_key();
    const second_key = generate_local_data_key();

    expect(first_key.length).toBe(LOCAL_DATA_KEY_LENGTH_BYTES);
    expect(first_key).not.toEqual(second_key);
  });

  it("unwraps a data key wrapped with the same device key", async () => {
    const wrapping_key = await require_key(await create_device_wrapping_key());
    const data_key = generate_local_data_key();

    const wrapped = await wrap_local_data_key(data_key, wrapping_key);
    if (!wrapped.success) return expect.unreachable(wrapped.error);
    const unwrapped = await unwrap_local_data_key(wrapped.data, wrapping_key);

    expect(wrapping_key.extractable).toBe(false);
    expect(wrapped.data.wrapped_data_key).not.toEqual(data_key);
    expect(unwrapped).toEqual({ success: true, data: data_key });
  });

  it("fails to unwrap with a different key", async () => {
    const wrapping_key = await require_key(await create_device_wrapping_key());
    const other_key = await require_key(await create_device_wrapping_key());
    const wrapped = await wrap_local_data_key(
      generate_local_data_key(),
      wrapping_key,
    );
    if (!wrapped.success) return expect.unreachable(wrapped.error);

    const unwrapped = await unwrap_local_data_key(wrapped.data, other_key);

    expect(unwrapped.success).toBe(false);
  });

  it("derives the same passkey wrapping key from the same PRF secret", async () => {
    const secret = new Uint8Array(32).fill(7);
    const first_key = await require_key(
      await derive_wrapping_key_from_passkey_secret(secret),
    );
    const second_key = await require_key(
      await derive_wrapping_key_from_passkey_secret(secret),
    );
    const wrong_key = await require_key(
      await derive_wrapping_key_from_passkey_secret(new Uint8Array(32)),
    );
    const data_key = generate_local_data_key();
    const wrapped = await wrap_local_data_key(data_key, first_key);
    if (!wrapped.success) return expect.unreachable(wrapped.error);

    expect(await unwrap_local_data_key(wrapped.data, second_key)).toEqual({
      success: true,
      data: data_key,
    });
    expect((await unwrap_local_data_key(wrapped.data, wrong_key)).success).toBe(
      false,
    );
  });

  it("derives the same PIN wrapping key only for the same PIN and salt", async () => {
    const salt = new Uint8Array(16).fill(3);
    const pin_key = await require_key(
      await derive_wrapping_key_from_pin({
        pin: "123456",
        salt,
        iterations: TEST_PIN_ITERATIONS,
      }),
    );
    const same_pin_key = await require_key(
      await derive_wrapping_key_from_pin({
        pin: "123456",
        salt,
        iterations: TEST_PIN_ITERATIONS,
      }),
    );
    const other_pin_key = await require_key(
      await derive_wrapping_key_from_pin({
        pin: "654321",
        salt,
        iterations: TEST_PIN_ITERATIONS,
      }),
    );
    const data_key = generate_local_data_key();
    const wrapped = await wrap_local_data_key(data_key, pin_key);
    if (!wrapped.success) return expect.unreachable(wrapped.error);

    expect(
      (await unwrap_local_data_key(wrapped.data, same_pin_key)).success,
    ).toBe(true);
    expect(
      (await unwrap_local_data_key(wrapped.data, other_pin_key)).success,
    ).toBe(false);
  });

  it("uses 600,000 PBKDF2 iterations for real PINs", () => {
    expect(PIN_KEY_ITERATIONS).toBe(600_000);
  });

  it("rejects PINs shorter than six characters", () => {
    expect(validate_local_vault_pin("12345").success).toBe(false);
    expect(validate_local_vault_pin("123456")).toEqual({
      success: true,
      data: "123456",
    });
  });
});
