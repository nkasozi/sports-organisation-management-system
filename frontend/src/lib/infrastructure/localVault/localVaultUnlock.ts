import { OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  LOCAL_VAULT_MODE,
  type LocalVaultMode,
  type LocalVaultRecord,
} from "./localVaultContracts";
import { unwrap_local_data_key } from "./localVaultKeyCrypto";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";
import type { LocalVaultServiceDependencies } from "./localVaultServiceTypes";
import {
  derive_wrapping_key_from_passkey_secret,
  derive_wrapping_key_from_pin,
} from "./localVaultWrappingKeys";

async function read_required_record(
  dependencies: LocalVaultServiceDependencies,
): AsyncResult<LocalVaultRecord> {
  const record_result = await dependencies.storage.read_record();
  if (!record_result.success) return record_result;
  return record_result.data.status === OptionStatus.SOME
    ? create_success_result(record_result.data.value)
    : create_failure_result(LOCAL_VAULT_MESSAGE.NO_VAULT);
}

async function unwrap_and_remember(
  dependencies: LocalVaultServiceDependencies,
  record: LocalVaultRecord,
  wrapping_key: CryptoKey,
  failure_message: string,
): AsyncResult<LocalVaultMode> {
  const data_key_result = await unwrap_local_data_key(record, wrapping_key);
  if (!data_key_result.success) return create_failure_result(failure_message);
  dependencies.key_holder.remember(data_key_result.data);
  console.info("[LocalVault] Local data unlocked", {
    event: LOCAL_VAULT_LOG_EVENT.VAULT_UNLOCKED,
    mode: record.unlock.mode,
  });
  return create_success_result(record.unlock.mode);
}

export async function unlock_vault_with_device_key(
  dependencies: LocalVaultServiceDependencies,
): AsyncResult<LocalVaultMode> {
  const record_result = await read_required_record(dependencies);
  if (!record_result.success) return record_result;
  const unlock = record_result.data.unlock;
  if (unlock.mode !== LOCAL_VAULT_MODE.DEVICE)
    return create_failure_result(LOCAL_VAULT_MESSAGE.WRONG_MODE_DEVICE);
  return unwrap_and_remember(
    dependencies,
    record_result.data,
    unlock.wrapping_key,
    LOCAL_VAULT_MESSAGE.DEVICE_KEY_FAILED,
  );
}

export async function unlock_vault_with_passkey(
  dependencies: LocalVaultServiceDependencies,
): AsyncResult<LocalVaultMode> {
  const record_result = await read_required_record(dependencies);
  if (!record_result.success) return record_result;
  const unlock = record_result.data.unlock;
  if (unlock.mode !== LOCAL_VAULT_MODE.PASSKEY)
    return create_failure_result(LOCAL_VAULT_MESSAGE.WRONG_MODE_PASSKEY);
  const secret_result = await dependencies.passkey_authenticator.read_secret({
    credential_id: unlock.credential_id,
    prf_salt: unlock.prf_salt,
  });
  if (!secret_result.success) return secret_result;
  const wrapping_key_result = await derive_wrapping_key_from_passkey_secret(
    secret_result.data.secret,
  );
  if (!wrapping_key_result.success) return wrapping_key_result;
  return unwrap_and_remember(
    dependencies,
    record_result.data,
    wrapping_key_result.data,
    LOCAL_VAULT_MESSAGE.PASSKEY_WRONG_SECRET,
  );
}

export async function unlock_vault_with_pin(
  dependencies: LocalVaultServiceDependencies,
  pin: string,
): AsyncResult<LocalVaultMode> {
  const record_result = await read_required_record(dependencies);
  if (!record_result.success) return record_result;
  const unlock = record_result.data.unlock;
  if (unlock.mode !== LOCAL_VAULT_MODE.PIN)
    return create_failure_result(LOCAL_VAULT_MESSAGE.WRONG_MODE_PIN);
  const wrapping_key_result = await derive_wrapping_key_from_pin({
    pin,
    salt: unlock.pin_salt,
    iterations: unlock.pin_iterations,
  });
  if (!wrapping_key_result.success) return wrapping_key_result;
  return unwrap_and_remember(
    dependencies,
    record_result.data,
    wrapping_key_result.data,
    LOCAL_VAULT_MESSAGE.PIN_WRONG,
  );
}
