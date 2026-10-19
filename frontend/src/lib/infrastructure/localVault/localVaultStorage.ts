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
  LOCAL_VAULT_RECORD_ID,
  type LocalVaultRecord,
} from "./localVaultContracts";
import type { LocalVaultDatabase } from "./localVaultDatabase";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
  type LocalVaultLogEvent,
} from "./localVaultMessages";

export interface LocalVaultStorage {
  read_record(): AsyncResult<Option<LocalVaultRecord>>;
  save_record(record: LocalVaultRecord): AsyncResult<boolean>;
  delete_record(): AsyncResult<boolean>;
}

function report_storage_failure(
  event: LocalVaultLogEvent,
  error: unknown,
): Result<never> {
  console.error("[LocalVault] Vault storage failed", {
    event,
    error: String(error),
  });
  return create_failure_result(LOCAL_VAULT_MESSAGE.STORAGE_FAILED);
}

async function read_vault_record(
  database: LocalVaultDatabase,
): AsyncResult<Option<LocalVaultRecord>> {
  try {
    const record = await database.vault.get(LOCAL_VAULT_RECORD_ID);
    return create_success_result(
      record ? create_some_option(record) : create_none_option(),
    );
  } catch (error) {
    return report_storage_failure(
      LOCAL_VAULT_LOG_EVENT.STORAGE_READ_FAILED,
      error,
    );
  }
}

async function save_vault_record(
  database: LocalVaultDatabase,
  record: LocalVaultRecord,
): AsyncResult<boolean> {
  try {
    await database.vault.put(record);
    return create_success_result(true);
  } catch (error) {
    return report_storage_failure(
      LOCAL_VAULT_LOG_EVENT.STORAGE_SAVE_FAILED,
      error,
    );
  }
}

async function delete_vault_record(
  database: LocalVaultDatabase,
): AsyncResult<boolean> {
  try {
    await database.vault.delete(LOCAL_VAULT_RECORD_ID);
    return create_success_result(true);
  } catch (error) {
    return report_storage_failure(
      LOCAL_VAULT_LOG_EVENT.STORAGE_DELETE_FAILED,
      error,
    );
  }
}

export function create_local_vault_storage(
  database: LocalVaultDatabase,
): LocalVaultStorage {
  return {
    read_record: () => read_vault_record(database),
    save_record: (record: LocalVaultRecord) =>
      save_vault_record(database, record),
    delete_record: () => delete_vault_record(database),
  };
}
