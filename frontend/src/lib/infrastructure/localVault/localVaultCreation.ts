import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import {
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_RECORD_ID,
  type LocalVaultUnlockMaterial,
  type PendingLocalVaultKey,
} from "./localVaultContracts";
import {
  create_random_bytes,
  generate_local_data_key,
  wrap_local_data_key,
} from "./localVaultKeyCrypto";
import type { LocalVaultServiceDependencies } from "./localVaultServiceTypes";
import {
  create_device_wrapping_key,
  derive_wrapping_key_from_passkey_secret,
  derive_wrapping_key_from_pin,
  PIN_SALT_LENGTH_BYTES,
  validate_local_vault_pin,
} from "./localVaultWrappingKeys";

async function build_pending_vault_key(
  dependencies: LocalVaultServiceDependencies,
  wrapping_key: CryptoKey,
  unlock: LocalVaultUnlockMaterial,
): AsyncResult<PendingLocalVaultKey> {
  const data_key = generate_local_data_key();
  const wrapped_result = await wrap_local_data_key(data_key, wrapping_key);
  if (!wrapped_result.success) return wrapped_result;
  return create_success_result({
    data_key,
    record: {
      id: LOCAL_VAULT_RECORD_ID,
      wrapped_data_key: wrapped_result.data.wrapped_data_key,
      wrap_iv: wrapped_result.data.wrap_iv,
      unlock,
      created_at: dependencies.read_current_time().toISOString(),
    },
  });
}

export async function create_device_pending_vault(
  dependencies: LocalVaultServiceDependencies,
): AsyncResult<PendingLocalVaultKey> {
  const wrapping_key_result = await create_device_wrapping_key();
  if (!wrapping_key_result.success) return wrapping_key_result;
  return build_pending_vault_key(dependencies, wrapping_key_result.data, {
    mode: LOCAL_VAULT_MODE.DEVICE,
    wrapping_key: wrapping_key_result.data,
  });
}

export async function create_passkey_pending_vault(
  dependencies: LocalVaultServiceDependencies,
  owner_label: string,
): AsyncResult<PendingLocalVaultKey> {
  const secret_result = await dependencies.passkey_authenticator.create_secret({
    relying_party_id: dependencies.read_relying_party_id(),
    owner_label,
  });
  if (!secret_result.success) return secret_result;
  const wrapping_key_result = await derive_wrapping_key_from_passkey_secret(
    secret_result.data.secret,
  );
  if (!wrapping_key_result.success) return wrapping_key_result;
  return build_pending_vault_key(dependencies, wrapping_key_result.data, {
    mode: LOCAL_VAULT_MODE.PASSKEY,
    credential_id: secret_result.data.credential_id,
    prf_salt: secret_result.data.prf_salt,
  });
}

export async function create_pin_pending_vault(
  dependencies: LocalVaultServiceDependencies,
  pin: string,
): AsyncResult<PendingLocalVaultKey> {
  const pin_result = validate_local_vault_pin(pin);
  if (!pin_result.success) return pin_result;
  const pin_salt = create_random_bytes(PIN_SALT_LENGTH_BYTES);
  const wrapping_key_result = await derive_wrapping_key_from_pin({
    pin: pin_result.data,
    salt: pin_salt,
    iterations: dependencies.pin_iterations,
  });
  if (!wrapping_key_result.success) return wrapping_key_result;
  return build_pending_vault_key(dependencies, wrapping_key_result.data, {
    mode: LOCAL_VAULT_MODE.PIN,
    pin_salt,
    pin_iterations: dependencies.pin_iterations,
  });
}
