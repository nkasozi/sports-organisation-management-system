import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { DeviceBackupDeleteState } from "$lib/infrastructure/backup/storageBackupContracts";
import { DEVICE_BACKUP_DELETE_STATUS } from "$lib/infrastructure/backup/storageBackupStatus";
import type {
  LocalVaultMode,
  LocalVaultService,
} from "$lib/infrastructure/localVault/localVaultContracts";

export const FRESH_START_REASON = {
  NO_VAULT: "no_vault",
  DEVICE_KEY_UNAVAILABLE: "device_key_unavailable",
  USER_STARTED_OVER: "user_started_over",
} as const;

type FreshStartReason =
  (typeof FRESH_START_REASON)[keyof typeof FRESH_START_REASON];

const LOCAL_VAULT_FRESH_START_EVENT = "local_vault_fresh_start";
const LOCAL_VAULT_FRESH_START_FAILED_EVENT = "local_vault_fresh_start_failed";
const LOCAL_VAULT_DATABASE_WIPE_FAILED_EVENT =
  "local_vault_database_wipe_failed";
const LOCAL_VAULT_STALE_BACKUP_KEPT_EVENT = "local_vault_stale_backup_kept";

export const LOCAL_VAULT_STARTED_FRESH = "started_fresh" as const;

interface LocalVaultFreshStartDependencies {
  vault_service: Pick<
    LocalVaultService,
    "create_device_unlock" | "activate_pending_vault"
  >;
  reset_database(): Promise<unknown>;
  delete_device_backup(): Promise<DeviceBackupDeleteState>;
}

async function wipe_local_database(
  dependencies: LocalVaultFreshStartDependencies,
): AsyncResult<boolean> {
  try {
    await dependencies.reset_database();
    return create_success_result(true);
  } catch (error) {
    console.error("[LocalVault] Local database could not be cleared", {
      event: LOCAL_VAULT_DATABASE_WIPE_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

async function delete_stale_device_backup(
  dependencies: LocalVaultFreshStartDependencies,
): Promise<boolean> {
  const delete_state = await dependencies.delete_device_backup();
  if (delete_state.status !== DEVICE_BACKUP_DELETE_STATUS.FAILED) return true;
  console.warn("[LocalVault] Old device backup could not be removed", {
    event: LOCAL_VAULT_STALE_BACKUP_KEPT_EVENT,
    error: delete_state.error,
  });
  return false;
}

export async function create_and_activate_device_vault(
  vault_service: Pick<
    LocalVaultService,
    "create_device_unlock" | "activate_pending_vault"
  >,
): AsyncResult<LocalVaultMode> {
  const pending = await vault_service.create_device_unlock();
  if (!pending.success) return pending;
  return vault_service.activate_pending_vault(pending.data);
}

function fail_fresh_start(
  reason: FreshStartReason,
  error: string,
): AsyncResult<typeof LOCAL_VAULT_STARTED_FRESH> {
  console.error("[LocalVault] Could not prepare a new local data key", {
    event: LOCAL_VAULT_FRESH_START_FAILED_EVENT,
    reason,
    error,
  });
  return Promise.resolve(create_failure_result(error));
}

export async function start_fresh_local_vault(
  dependencies: LocalVaultFreshStartDependencies,
  reason: FreshStartReason,
): AsyncResult<typeof LOCAL_VAULT_STARTED_FRESH> {
  console.warn("[LocalVault] Starting this device with a new data key", {
    event: LOCAL_VAULT_FRESH_START_EVENT,
    reason,
  });
  const wiped = await wipe_local_database(dependencies);
  if (!wiped.success) return fail_fresh_start(reason, wiped.error);
  await delete_stale_device_backup(dependencies);
  const activated = await create_and_activate_device_vault(
    dependencies.vault_service,
  );
  if (!activated.success) return fail_fresh_start(reason, activated.error);
  return create_success_result(LOCAL_VAULT_STARTED_FRESH);
}
