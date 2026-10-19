import { reset_database } from "$lib/adapters/repositories/database";
import type { AsyncResult } from "$lib/core/types/Result";
import { get_storage_backup_coordinator } from "$lib/infrastructure/backup/storageBackupRuntime";
import type {
  LocalVaultMode,
  PendingLocalVaultKey,
} from "$lib/infrastructure/localVault/localVaultContracts";
import { local_vault_service } from "$lib/infrastructure/localVault/localVaultServiceInstance";

import { create_and_activate_device_vault } from "./localVaultFreshStart";
import type { LocalVaultProtectionResolution } from "./localVaultPromptGate";
import { LOCAL_VAULT_PROMPT_MESSAGE } from "./localVaultPromptMessages";
import { local_vault_prompt_gate } from "./localVaultPromptRuntime";
import { request_local_vault_sign_in_protection } from "./localVaultSignInProtectionFlow";
import { run_local_vault_startup_unlock } from "./localVaultStartupUnlockFlow";

export async function unlock_local_data_on_startup(): Promise<boolean> {
  const outcome = await run_local_vault_startup_unlock({
    vault_service: local_vault_service,
    reset_database,
    delete_device_backup: () =>
      get_storage_backup_coordinator().delete_device_backup(),
    wait_for_unlock: local_vault_prompt_gate.wait_for_unlock,
  });
  if (outcome.success) return true;
  local_vault_prompt_gate.show_unavailable(
    LOCAL_VAULT_PROMPT_MESSAGE.LOCAL_DATA_UNAVAILABLE,
  );
  return false;
}

export function protect_local_data_for_sign_in(
  owner_label: string,
): Promise<LocalVaultProtectionResolution> {
  return request_local_vault_sign_in_protection(
    {
      is_passkey_unlock_available: () =>
        local_vault_service.is_passkey_unlock_available(),
      wait_for_protection: local_vault_prompt_gate.wait_for_protection,
    },
    owner_label,
  );
}

export function activate_local_vault(
  pending: PendingLocalVaultKey,
): AsyncResult<LocalVaultMode> {
  return local_vault_service.activate_pending_vault(pending);
}

export function replace_local_vault_with_device_key(): AsyncResult<LocalVaultMode> {
  return create_and_activate_device_vault(local_vault_service);
}
