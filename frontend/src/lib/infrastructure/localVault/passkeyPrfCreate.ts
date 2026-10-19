import { OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { create_random_bytes } from "./localVaultKeyCrypto";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";
import {
  PASSKEY_CHALLENGE_LENGTH_BYTES,
  PUBLIC_KEY_CREDENTIAL_TYPE,
  read_passkey_prf_secret,
  REQUIRED_USER_VERIFICATION,
} from "./passkeyPrfRead";
import {
  type PasskeyPrfOutcome,
  read_credential_id,
  read_passkey_prf_outcome,
  request_passkey_credential,
} from "./passkeyPrfSupport";
import type {
  CreatePasskeyPrfCommand,
  PasskeyCredentialsApi,
  PasskeyPrfReference,
  PasskeyPrfSecret,
} from "./passkeyPrfTypes";

const PASSKEY_RELYING_PARTY_NAME = "Sport-Sync";
const PRF_SALT_LENGTH_BYTES = 32;
const PASSKEY_USER_ID_LENGTH_BYTES = 16;
const ES256_ALGORITHM_ID = -7;
const RS256_ALGORITHM_ID = -257;
const PLATFORM_AUTHENTICATOR_ATTACHMENT = "platform";
const PREFERRED_RESIDENT_KEY = "preferred";

function build_passkey_creation_options(
  command: CreatePasskeyPrfCommand,
  prf_salt: Uint8Array<ArrayBuffer>,
): CredentialCreationOptions {
  return {
    publicKey: {
      rp: { name: PASSKEY_RELYING_PARTY_NAME, id: command.relying_party_id },
      user: {
        id: create_random_bytes(PASSKEY_USER_ID_LENGTH_BYTES),
        name: command.owner_label,
        displayName: command.owner_label,
      },
      challenge: create_random_bytes(PASSKEY_CHALLENGE_LENGTH_BYTES),
      pubKeyCredParams: [
        { type: PUBLIC_KEY_CREDENTIAL_TYPE, alg: ES256_ALGORITHM_ID },
        { type: PUBLIC_KEY_CREDENTIAL_TYPE, alg: RS256_ALGORITHM_ID },
      ],
      authenticatorSelection: {
        authenticatorAttachment: PLATFORM_AUTHENTICATOR_ATTACHMENT,
        userVerification: REQUIRED_USER_VERIFICATION,
        residentKey: PREFERRED_RESIDENT_KEY,
      },
      extensions: { prf: { eval: { first: prf_salt } } },
    },
  };
}

function resolve_created_passkey_secret(
  credentials: PasskeyCredentialsApi,
  reference: PasskeyPrfReference,
  prf_outcome: PasskeyPrfOutcome,
): AsyncResult<PasskeyPrfSecret> {
  if (prf_outcome.first_secret.status === OptionStatus.SOME)
    return Promise.resolve(
      create_success_result({
        ...reference,
        secret: prf_outcome.first_secret.value,
      }),
    );
  if (!prf_outcome.prf_enabled) {
    console.warn("[LocalVault] The new passkey does not support PRF", {
      event: LOCAL_VAULT_LOG_EVENT.PASSKEY_WITHOUT_PRF,
    });
    return Promise.resolve(
      create_failure_result(LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE),
    );
  }
  return read_passkey_prf_secret(credentials, reference);
}

export async function create_passkey_prf_secret(
  credentials: PasskeyCredentialsApi,
  command: CreatePasskeyPrfCommand,
): AsyncResult<PasskeyPrfSecret> {
  const prf_salt = create_random_bytes(PRF_SALT_LENGTH_BYTES);
  const credential_result = await request_passkey_credential(() =>
    credentials.create(build_passkey_creation_options(command, prf_salt)),
  );
  if (!credential_result.success) return credential_result;
  const credential_id_result = read_credential_id(credential_result.data);
  if (!credential_id_result.success) return credential_id_result;
  return resolve_created_passkey_secret(
    credentials,
    { credential_id: credential_id_result.data, prf_salt },
    read_passkey_prf_outcome(credential_result.data),
  );
}
