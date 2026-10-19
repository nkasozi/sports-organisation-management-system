import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";
import type { DeviceBackupDeleteState } from "$lib/infrastructure/backup/storageBackupContracts";
import {
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_STATUS,
  type LocalVaultMode,
  type LocalVaultService,
} from "$lib/infrastructure/localVault/localVaultContracts";

import {
  FRESH_START_REASON,
  LOCAL_VAULT_STARTED_FRESH,
  start_fresh_local_vault,
} from "./localVaultFreshStart";
import {
  LOCAL_VAULT_UNLOCK_RESOLUTION,
  type LocalVaultUnlockResolution,
} from "./localVaultPromptGate";
import { LOCAL_VAULT_PROMPT_MESSAGE } from "./localVaultPromptMessages";
import {
  LOCAL_VAULT_STORAGE_RETRY_METHOD,
  type LocalVaultUnlockPromptMethod,
} from "./localVaultPromptState";

const LOCAL_VAULT_STARTUP_OUTCOME = {
  ALREADY_UNLOCKED: "already_unlocked",
  UNLOCKED: "unlocked",
  RESUMED: "resumed",
  STARTED_FRESH: LOCAL_VAULT_STARTED_FRESH,
} as const;

type LocalVaultStartupOutcome =
  (typeof LOCAL_VAULT_STARTUP_OUTCOME)[keyof typeof LOCAL_VAULT_STARTUP_OUTCOME];

const LOCAL_VAULT_STORAGE_UNREADABLE_EVENT = "local_vault_storage_unreadable";

interface LocalVaultStartupUnlockDependencies {
  vault_service: Pick<
    LocalVaultService,
    | "read_status"
    | "unlock_with_device_key"
    | "create_device_unlock"
    | "activate_pending_vault"
    | "resume_unlock_session"
  >;
  reset_database(): Promise<unknown>;
  delete_device_backup(): Promise<DeviceBackupDeleteState>;
  wait_for_unlock(
    method: LocalVaultUnlockPromptMethod,
    message: string,
  ): Promise<LocalVaultUnlockResolution>;
}

async function unlock_device_vault(
  dependencies: LocalVaultStartupUnlockDependencies,
): AsyncResult<LocalVaultStartupOutcome> {
  const unlocked = await dependencies.vault_service.unlock_with_device_key();
  if (unlocked.success)
    return create_success_result(LOCAL_VAULT_STARTUP_OUTCOME.UNLOCKED);
  return start_fresh_local_vault(
    dependencies,
    FRESH_START_REASON.DEVICE_KEY_UNAVAILABLE,
  );
}

async function unlock_with_prompt(
  dependencies: LocalVaultStartupUnlockDependencies,
  method: LocalVaultUnlockPromptMethod,
  message: string,
): AsyncResult<LocalVaultStartupOutcome> {
  const resolution = await dependencies.wait_for_unlock(method, message);
  switch (resolution) {
    case LOCAL_VAULT_UNLOCK_RESOLUTION.UNLOCKED:
      return create_success_result(LOCAL_VAULT_STARTUP_OUTCOME.UNLOCKED);
    case LOCAL_VAULT_UNLOCK_RESOLUTION.START_OVER:
      return start_fresh_local_vault(
        dependencies,
        FRESH_START_REASON.USER_STARTED_OVER,
      );
    case LOCAL_VAULT_UNLOCK_RESOLUTION.RETRY:
      return run_local_vault_startup_unlock(dependencies);
  }
}

function wait_for_readable_storage(
  dependencies: LocalVaultStartupUnlockDependencies,
): AsyncResult<LocalVaultStartupOutcome> {
  console.warn("[LocalVault] Secure storage could not be read, not wiping", {
    event: LOCAL_VAULT_STORAGE_UNREADABLE_EVENT,
  });
  return unlock_with_prompt(
    dependencies,
    LOCAL_VAULT_STORAGE_RETRY_METHOD,
    LOCAL_VAULT_PROMPT_MESSAGE.STORAGE_UNREADABLE,
  );
}

async function resume_or_prompt_unlock(
  dependencies: LocalVaultStartupUnlockDependencies,
  method: LocalVaultUnlockPromptMethod,
): AsyncResult<LocalVaultStartupOutcome> {
  const resumed = await dependencies.vault_service.resume_unlock_session();
  if (resumed.success)
    return create_success_result(LOCAL_VAULT_STARTUP_OUTCOME.RESUMED);
  return unlock_with_prompt(dependencies, method, "");
}

function unlock_locked_vault(
  dependencies: LocalVaultStartupUnlockDependencies,
  mode: LocalVaultMode,
): AsyncResult<LocalVaultStartupOutcome> {
  switch (mode) {
    case LOCAL_VAULT_MODE.DEVICE:
      return unlock_device_vault(dependencies);
    case LOCAL_VAULT_MODE.PASSKEY:
    case LOCAL_VAULT_MODE.PIN:
      return resume_or_prompt_unlock(dependencies, mode);
  }
}

export async function run_local_vault_startup_unlock(
  dependencies: LocalVaultStartupUnlockDependencies,
): AsyncResult<LocalVaultStartupOutcome> {
  const status = await dependencies.vault_service.read_status();
  switch (status.kind) {
    case LOCAL_VAULT_STATUS.NO_VAULT:
      return start_fresh_local_vault(dependencies, FRESH_START_REASON.NO_VAULT);
    case LOCAL_VAULT_STATUS.LOCKED:
      return unlock_locked_vault(dependencies, status.mode);
    case LOCAL_VAULT_STATUS.UNREADABLE:
      return wait_for_readable_storage(dependencies);
    case LOCAL_VAULT_STATUS.UNLOCKED:
      return create_success_result(
        LOCAL_VAULT_STARTUP_OUTCOME.ALREADY_UNLOCKED,
      );
  }
}
