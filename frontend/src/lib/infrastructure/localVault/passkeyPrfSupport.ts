import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";

const WEBAUTHN_ERROR_NAME = {
  NOT_ALLOWED: "NotAllowedError",
  ABORT: "AbortError",
  NOT_SUPPORTED: "NotSupportedError",
} as const;
const FUNCTION_TYPE_NAME = "function";
const BASE64_PADDING_CHARACTER = "=";
const BASE64_BLOCK_LENGTH = 4;
const STANDARD_PLUS_PATTERN = /\+/g;
const STANDARD_SLASH_PATTERN = /\//g;
const URL_DASH_PATTERN = /-/g;
const URL_UNDERSCORE_PATTERN = /_/g;
const TRAILING_PADDING_PATTERN = /=+$/;
const URL_DASH = "-";
const URL_UNDERSCORE = "_";
const STANDARD_PLUS = "+";
const STANDARD_SLASH = "/";
const EMPTY_TEXT = "";

export interface PasskeyPrfOutcome {
  prf_enabled: boolean;
  first_secret: Option<Uint8Array>;
}

export function encode_base64url(bytes: Uint8Array): string {
  const binary_text = Array.from(bytes, (byte: number) =>
    String.fromCharCode(byte),
  ).join(EMPTY_TEXT);
  return btoa(binary_text)
    .replace(STANDARD_PLUS_PATTERN, URL_DASH)
    .replace(STANDARD_SLASH_PATTERN, URL_UNDERSCORE)
    .replace(TRAILING_PADDING_PATTERN, EMPTY_TEXT);
}

export function decode_base64url(encoded: string): Uint8Array<ArrayBuffer> {
  const standard_text = encoded
    .replace(URL_DASH_PATTERN, STANDARD_PLUS)
    .replace(URL_UNDERSCORE_PATTERN, STANDARD_SLASH);
  const padding_length =
    (BASE64_BLOCK_LENGTH - (standard_text.length % BASE64_BLOCK_LENGTH)) %
    BASE64_BLOCK_LENGTH;
  const padded_text =
    standard_text + BASE64_PADDING_CHARACTER.repeat(padding_length);
  return Uint8Array.from(atob(padded_text), (character: string) =>
    character.charCodeAt(0),
  );
}

function copy_buffer_source(source: BufferSource): Uint8Array {
  return ArrayBuffer.isView(source)
    ? new Uint8Array(
        source.buffer.slice(
          source.byteOffset,
          source.byteOffset + source.byteLength,
        ),
      )
    : new Uint8Array(source.slice(0));
}

export function read_passkey_prf_outcome(
  credential: Credential,
): PasskeyPrfOutcome {
  const public_key_credential = credential as PublicKeyCredential;
  const has_extension_results =
    typeof public_key_credential.getClientExtensionResults ===
    FUNCTION_TYPE_NAME;
  const prf_outputs = has_extension_results
    ? (public_key_credential.getClientExtensionResults().prf ?? {})
    : {};
  const first_secret = prf_outputs.results?.first;
  return {
    prf_enabled: prf_outputs.enabled === true,
    first_secret: first_secret
      ? create_some_option(copy_buffer_source(first_secret))
      : create_none_option(),
  };
}

export function read_credential_id(credential: Credential): Result<string> {
  const raw_id = (credential as PublicKeyCredential).rawId;
  if (!raw_id) {
    console.warn("[LocalVault] The passkey did not return its id", {
      event: LOCAL_VAULT_LOG_EVENT.PASSKEY_REQUEST_FAILED,
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_FAILED);
  }
  return create_success_result(encode_base64url(new Uint8Array(raw_id)));
}

function describe_passkey_failure(error_name: string): string {
  switch (error_name) {
    case WEBAUTHN_ERROR_NAME.NOT_ALLOWED:
    case WEBAUTHN_ERROR_NAME.ABORT:
      return LOCAL_VAULT_MESSAGE.PASSKEY_CANCELLED;
    case WEBAUTHN_ERROR_NAME.NOT_SUPPORTED:
      return LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE;
    default:
      return LOCAL_VAULT_MESSAGE.PASSKEY_FAILED;
  }
}

export async function request_passkey_credential(
  operation: () => ReturnType<CredentialsContainer["get"]>,
): AsyncResult<Credential> {
  try {
    const credential = await operation();
    if (!credential) {
      console.warn("[LocalVault] The passkey request returned nothing", {
        event: LOCAL_VAULT_LOG_EVENT.PASSKEY_REQUEST_FAILED,
      });
      return create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_FAILED);
    }
    return create_success_result(credential);
  } catch (error) {
    const error_name = error instanceof Error ? error.name : String(error);
    console.warn("[LocalVault] The passkey request did not complete", {
      event: LOCAL_VAULT_LOG_EVENT.PASSKEY_REQUEST_FAILED,
      error_name,
      error: String(error),
    });
    return create_failure_result(describe_passkey_failure(error_name));
  }
}
