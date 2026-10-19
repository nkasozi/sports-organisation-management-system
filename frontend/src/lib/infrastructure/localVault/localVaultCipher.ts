import { gcm } from "@noble/ciphers/aes";
import { randomBytes } from "@noble/ciphers/webcrypto";

import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

export const LOCAL_VAULT_NONCE_LENGTH_BYTES = 12;

const STRING_TYPE_NAME = "string";

const LocalVaultCipherFailure = {
  SEALED_BYTES_TOO_SHORT: "Sealed bytes are shorter than a nonce",
  OPEN_FAILED: "Sealed bytes could not be opened with this key",
  NOT_SERIALIZABLE: "Value could not be written as JSON",
  NOT_JSON: "Opened bytes are not valid JSON",
  SEAL_FAILED: "Value could not be sealed with this key",
} as const;

const LocalVaultCipherEvent = {
  OPEN_FAILED: "local_vault_cipher_open_failed",
  SERIALIZE_FAILED: "local_vault_cipher_serialize_failed",
  PARSE_FAILED: "local_vault_cipher_parse_failed",
  SEAL_FAILED: "local_vault_cipher_seal_failed",
} as const;

export function seal_local_bytes(
  data_key: Uint8Array,
  plaintext: Uint8Array,
  associated_data: Uint8Array,
): Uint8Array {
  const nonce = randomBytes(LOCAL_VAULT_NONCE_LENGTH_BYTES);
  const ciphertext = gcm(data_key, nonce, associated_data).encrypt(plaintext);
  const sealed = new Uint8Array(nonce.length + ciphertext.length);
  sealed.set(nonce, 0);
  sealed.set(ciphertext, nonce.length);
  return sealed;
}

export function open_local_bytes(
  data_key: Uint8Array,
  sealed: Uint8Array,
  associated_data: Uint8Array,
): Result<Uint8Array> {
  if (sealed.length <= LOCAL_VAULT_NONCE_LENGTH_BYTES)
    return create_failure_result(
      LocalVaultCipherFailure.SEALED_BYTES_TOO_SHORT,
    );
  const nonce = sealed.subarray(0, LOCAL_VAULT_NONCE_LENGTH_BYTES);
  const ciphertext = sealed.subarray(LOCAL_VAULT_NONCE_LENGTH_BYTES);
  try {
    return create_success_result(
      gcm(data_key, nonce, associated_data).decrypt(ciphertext),
    );
  } catch (error) {
    console.warn("[LocalVaultCipher] Sealed bytes failed authentication", {
      event: LocalVaultCipherEvent.OPEN_FAILED,
      error: String(error),
    });
    return create_failure_result(LocalVaultCipherFailure.OPEN_FAILED);
  }
}

function write_json_text(value: unknown): Result<string> {
  try {
    const json_text: unknown = JSON.stringify(value);
    return typeof json_text === STRING_TYPE_NAME
      ? create_success_result(json_text as string)
      : create_failure_result(LocalVaultCipherFailure.NOT_SERIALIZABLE);
  } catch (error) {
    console.warn("[LocalVaultCipher] Value could not be serialized", {
      event: LocalVaultCipherEvent.SERIALIZE_FAILED,
      error: String(error),
    });
    return create_failure_result(LocalVaultCipherFailure.NOT_SERIALIZABLE);
  }
}

function read_json_text(json_text: string): Result<unknown> {
  try {
    return create_success_result(JSON.parse(json_text) as unknown);
  } catch (error) {
    console.warn("[LocalVaultCipher] Opened bytes are not JSON", {
      event: LocalVaultCipherEvent.PARSE_FAILED,
      error: String(error),
    });
    return create_failure_result(LocalVaultCipherFailure.NOT_JSON);
  }
}

export function seal_local_json(
  data_key: Uint8Array,
  value: unknown,
  associated_data: Uint8Array,
): Result<Uint8Array> {
  const json_text = write_json_text(value);
  if (!json_text.success) return json_text;
  const plaintext = new TextEncoder().encode(json_text.data);
  try {
    return create_success_result(
      seal_local_bytes(data_key, plaintext, associated_data),
    );
  } catch (error) {
    console.error("[LocalVaultCipher] Value could not be sealed", {
      event: LocalVaultCipherEvent.SEAL_FAILED,
      error: String(error),
    });
    return create_failure_result(LocalVaultCipherFailure.SEAL_FAILED);
  }
}

export function open_local_json(
  data_key: Uint8Array,
  sealed: Uint8Array,
  associated_data: Uint8Array,
): Result<unknown> {
  const opened = open_local_bytes(data_key, sealed, associated_data);
  if (!opened.success) return opened;
  return read_json_text(new TextDecoder().decode(opened.data));
}
