import { type AsyncResult } from "$lib/core/types/Result";

import {
  create_local_unlock_session_tracker,
  type LocalUnlockSessionContext,
} from "./localUnlockSessionLifecycle";
import {
  create_unlock_session_methods,
  keep_unlock_session_for_mode,
  start_session_after_unlock,
} from "./localUnlockSessionMethods";
import {
  LOCAL_VAULT_STATUS,
  type LocalVaultMode,
  type LocalVaultService,
  type LocalVaultStatus,
  type PendingLocalVaultKey,
} from "./localVaultContracts";
import {
  create_device_pending_vault,
  create_passkey_pending_vault,
  create_pin_pending_vault,
} from "./localVaultCreation";
import { LOCAL_VAULT_LOG_EVENT } from "./localVaultMessages";
import type { LocalVaultServiceDependencies } from "./localVaultServiceTypes";
import { resolve_local_vault_status } from "./localVaultStatusMachine";
import {
  unlock_vault_with_device_key,
  unlock_vault_with_passkey,
  unlock_vault_with_pin,
} from "./localVaultUnlock";

async function read_vault_status(
  dependencies: LocalVaultServiceDependencies,
): Promise<LocalVaultStatus> {
  const record_result = await dependencies.storage.read_record();
  if (!record_result.success) return { kind: LOCAL_VAULT_STATUS.UNREADABLE };
  return resolve_local_vault_status(
    record_result.data,
    dependencies.key_holder.current(),
  );
}

async function activate_pending_vault(
  context: LocalUnlockSessionContext,
  pending: PendingLocalVaultKey,
): AsyncResult<LocalVaultMode> {
  const dependencies = context.dependencies;
  const save_result = await dependencies.storage.save_record(pending.record);
  if (!save_result.success) return save_result;
  dependencies.key_holder.remember(pending.data_key);
  console.info("[LocalVault] New local data key activated", {
    event: LOCAL_VAULT_LOG_EVENT.VAULT_ACTIVATED,
    mode: pending.record.unlock.mode,
  });
  return keep_unlock_session_for_mode(
    context,
    pending.record.unlock.mode,
    pending.data_key,
  );
}

export function create_local_vault_service(
  dependencies: LocalVaultServiceDependencies,
): LocalVaultService {
  const context: LocalUnlockSessionContext = {
    dependencies,
    tracker: create_local_unlock_session_tracker(),
  };
  return {
    read_status: () => read_vault_status(dependencies),
    is_passkey_unlock_available: () =>
      dependencies.passkey_authenticator.is_available(),
    unlock_with_device_key: () => unlock_vault_with_device_key(dependencies),
    unlock_with_passkey: () =>
      start_session_after_unlock(
        context,
        unlock_vault_with_passkey(dependencies),
      ),
    unlock_with_pin: (pin: string) =>
      start_session_after_unlock(
        context,
        unlock_vault_with_pin(dependencies, pin),
      ),
    create_device_unlock: () => create_device_pending_vault(dependencies),
    create_passkey_unlock: (owner_label: string) =>
      create_passkey_pending_vault(dependencies, owner_label),
    create_pin_unlock: (pin: string) =>
      create_pin_pending_vault(dependencies, pin),
    activate_pending_vault: (pending: PendingLocalVaultKey) =>
      activate_pending_vault(context, pending),
    ...create_unlock_session_methods(context),
  };
}
