import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { LOCAL_DATA_KEY_LENGTH_BYTES } from "./localVaultContracts";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";

export const LOCAL_VAULT_WRAP_ALGORITHM = "AES-GCM";
export const LOCAL_VAULT_WRAP_KEY_LENGTH_BITS = 256;
const WRAP_IV_LENGTH_BYTES = 12;

interface WrappedLocalDataKey {
  wrapped_data_key: Uint8Array;
  wrap_iv: Uint8Array;
}

export function copy_to_buffer_bytes(
  bytes: Uint8Array,
): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes);
}

export function create_random_bytes(
  length_bytes: number,
): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length_bytes));
}

export function generate_local_data_key(): Uint8Array<ArrayBuffer> {
  return create_random_bytes(LOCAL_DATA_KEY_LENGTH_BYTES);
}

export async function wrap_local_data_key(
  data_key: Uint8Array,
  wrapping_key: CryptoKey,
): AsyncResult<WrappedLocalDataKey> {
  const wrap_iv = create_random_bytes(WRAP_IV_LENGTH_BYTES);
  try {
    const wrapped_buffer = await crypto.subtle.encrypt(
      { name: LOCAL_VAULT_WRAP_ALGORITHM, iv: wrap_iv },
      wrapping_key,
      copy_to_buffer_bytes(data_key),
    );
    return create_success_result({
      wrapped_data_key: new Uint8Array(wrapped_buffer),
      wrap_iv,
    });
  } catch (error) {
    console.error("[LocalVault] Failed to wrap the data key", {
      event: LOCAL_VAULT_LOG_EVENT.KEY_WRAP_FAILED,
      error: String(error),
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.KEY_SETUP_FAILED);
  }
}

export async function unwrap_local_data_key(
  wrapped: WrappedLocalDataKey,
  wrapping_key: CryptoKey,
): AsyncResult<Uint8Array> {
  try {
    const data_key_buffer = await crypto.subtle.decrypt(
      {
        name: LOCAL_VAULT_WRAP_ALGORITHM,
        iv: copy_to_buffer_bytes(wrapped.wrap_iv),
      },
      wrapping_key,
      copy_to_buffer_bytes(wrapped.wrapped_data_key),
    );
    return create_success_result(new Uint8Array(data_key_buffer));
  } catch (error) {
    console.warn("[LocalVault] The data key could not be unwrapped", {
      event: LOCAL_VAULT_LOG_EVENT.KEY_UNWRAP_FAILED,
      error: String(error),
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.DEVICE_KEY_FAILED);
  }
}
