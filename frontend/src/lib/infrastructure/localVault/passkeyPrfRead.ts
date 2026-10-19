import { OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  copy_to_buffer_bytes,
  create_random_bytes,
} from "./localVaultKeyCrypto";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";
import {
  decode_base64url,
  read_credential_id,
  read_passkey_prf_outcome,
  request_passkey_credential,
} from "./passkeyPrfSupport";
import type {
  PasskeyCredentialsApi,
  PasskeyPrfReference,
  PasskeyPrfSecret,
} from "./passkeyPrfTypes";

export const PASSKEY_CHALLENGE_LENGTH_BYTES = 32;
export const PUBLIC_KEY_CREDENTIAL_TYPE = "public-key";
export const REQUIRED_USER_VERIFICATION = "required";

function build_passkey_request_options(
  reference: PasskeyPrfReference,
): CredentialRequestOptions {
  return {
    publicKey: {
      challenge: create_random_bytes(PASSKEY_CHALLENGE_LENGTH_BYTES),
      allowCredentials: [
        {
          type: PUBLIC_KEY_CREDENTIAL_TYPE,
          id: decode_base64url(reference.credential_id),
        },
      ],
      userVerification: REQUIRED_USER_VERIFICATION,
      extensions: {
        prf: {
          evalByCredential: {
            [reference.credential_id]: {
              first: copy_to_buffer_bytes(reference.prf_salt),
            },
          },
        },
      },
    },
  };
}

export async function read_passkey_prf_secret(
  credentials: PasskeyCredentialsApi,
  reference: PasskeyPrfReference,
): AsyncResult<PasskeyPrfSecret> {
  const credential_result = await request_passkey_credential(() =>
    credentials.get(build_passkey_request_options(reference)),
  );
  if (!credential_result.success) return credential_result;
  const credential_id_result = read_credential_id(credential_result.data);
  if (!credential_id_result.success) return credential_id_result;
  if (credential_id_result.data !== reference.credential_id)
    return create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_WRONG_SECRET);
  const prf_outcome = read_passkey_prf_outcome(credential_result.data);
  if (prf_outcome.first_secret.status !== OptionStatus.SOME) {
    console.warn("[LocalVault] The passkey returned no PRF secret", {
      event: LOCAL_VAULT_LOG_EVENT.PASSKEY_WITHOUT_PRF,
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE);
  }
  return create_success_result({
    credential_id: reference.credential_id,
    prf_salt: reference.prf_salt,
    secret: prf_outcome.first_secret.value,
  });
}
