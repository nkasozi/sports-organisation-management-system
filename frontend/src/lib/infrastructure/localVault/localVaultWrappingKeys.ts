import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  copy_to_buffer_bytes,
  LOCAL_VAULT_WRAP_ALGORITHM,
  LOCAL_VAULT_WRAP_KEY_LENGTH_BITS,
} from "./localVaultKeyCrypto";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";

export const PIN_KEY_ITERATIONS = 600_000;
export const PIN_SALT_LENGTH_BYTES = 16;
const MINIMUM_PIN_LENGTH = 6;
const PASSKEY_KEY_INFO = "sport-sync-local-vault";
const PASSKEY_HKDF_SALT_LENGTH_BYTES = 32;
const HASH_ALGORITHM = "SHA-256";
const HKDF_ALGORITHM = "HKDF";
const PBKDF2_ALGORITHM = "PBKDF2";
const RAW_KEY_FORMAT = "raw";
const WRAPPING_KEY_USAGES: KeyUsage[] = ["encrypt", "decrypt"];
const DERIVE_KEY_USAGES: KeyUsage[] = ["deriveKey"];
const WRAPPING_KEY_ALGORITHM = {
  name: LOCAL_VAULT_WRAP_ALGORITHM,
  length: LOCAL_VAULT_WRAP_KEY_LENGTH_BITS,
};

interface DerivePinWrappingKeyCommand {
  pin: string;
  salt: Uint8Array;
  iterations: number;
}

export function validate_local_vault_pin(pin: string): Result<string> {
  return pin.length < MINIMUM_PIN_LENGTH
    ? create_failure_result(LOCAL_VAULT_MESSAGE.PIN_TOO_SHORT)
    : create_success_result(pin);
}

async function attempt_wrapping_key(
  produce_key: () => Promise<CryptoKey>,
): AsyncResult<CryptoKey> {
  try {
    return create_success_result(await produce_key());
  } catch (error) {
    console.error("[LocalVault] Failed to prepare a wrapping key", {
      event: LOCAL_VAULT_LOG_EVENT.WRAPPING_KEY_FAILED,
      error: String(error),
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.KEY_SETUP_FAILED);
  }
}

export function create_device_wrapping_key(): AsyncResult<CryptoKey> {
  return attempt_wrapping_key(() =>
    crypto.subtle.generateKey(
      WRAPPING_KEY_ALGORITHM,
      false,
      WRAPPING_KEY_USAGES,
    ),
  );
}

async function derive_passkey_key(secret: Uint8Array): Promise<CryptoKey> {
  const secret_material = await crypto.subtle.importKey(
    RAW_KEY_FORMAT,
    copy_to_buffer_bytes(secret),
    HKDF_ALGORITHM,
    false,
    DERIVE_KEY_USAGES,
  );
  return crypto.subtle.deriveKey(
    {
      name: HKDF_ALGORITHM,
      hash: HASH_ALGORITHM,
      salt: new Uint8Array(PASSKEY_HKDF_SALT_LENGTH_BYTES),
      info: new TextEncoder().encode(PASSKEY_KEY_INFO),
    },
    secret_material,
    WRAPPING_KEY_ALGORITHM,
    false,
    WRAPPING_KEY_USAGES,
  );
}

export function derive_wrapping_key_from_passkey_secret(
  secret: Uint8Array,
): AsyncResult<CryptoKey> {
  return attempt_wrapping_key(() => derive_passkey_key(secret));
}

async function derive_pin_key(
  command: DerivePinWrappingKeyCommand,
): Promise<CryptoKey> {
  const pin_material = await crypto.subtle.importKey(
    RAW_KEY_FORMAT,
    new TextEncoder().encode(command.pin),
    PBKDF2_ALGORITHM,
    false,
    DERIVE_KEY_USAGES,
  );
  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGORITHM,
      salt: copy_to_buffer_bytes(command.salt),
      iterations: command.iterations,
      hash: HASH_ALGORITHM,
    },
    pin_material,
    WRAPPING_KEY_ALGORITHM,
    false,
    WRAPPING_KEY_USAGES,
  );
}

export function derive_wrapping_key_from_pin(
  command: DerivePinWrappingKeyCommand,
): AsyncResult<CryptoKey> {
  return attempt_wrapping_key(() => derive_pin_key(command));
}
