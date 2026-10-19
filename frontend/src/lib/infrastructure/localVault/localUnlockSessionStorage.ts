import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type LocalUnlockSessionTimes,
  mark_local_unlock_session_seen,
} from "./localUnlockSessionRules";
import {
  LOCAL_UNLOCK_SESSION_RECORD_ID,
  type LocalUnlockSessionRecord,
} from "./localVaultContracts";
import type { LocalVaultDatabase } from "./localVaultDatabase";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";

export const LOCAL_UNLOCK_SESSION_REFRESH = {
  MISSING: "missing",
  EXPIRED: "expired",
  REFRESHED: "refreshed",
} as const;

export type LocalUnlockSessionRefresh =
  | { kind: typeof LOCAL_UNLOCK_SESSION_REFRESH.MISSING }
  | { kind: typeof LOCAL_UNLOCK_SESSION_REFRESH.EXPIRED }
  | {
      kind: typeof LOCAL_UNLOCK_SESSION_REFRESH.REFRESHED;
      record: LocalUnlockSessionRecord;
    };

export interface RefreshLocalUnlockSessionCommand {
  now: number;
  is_in_sight: boolean;
  is_expired(times: LocalUnlockSessionTimes, now: number): boolean;
}

export interface LocalUnlockSessionStorage {
  read_record(): AsyncResult<Option<LocalUnlockSessionRecord>>;
  save_record(record: LocalUnlockSessionRecord): AsyncResult<boolean>;
  delete_record(): AsyncResult<boolean>;
  refresh_record(
    command: RefreshLocalUnlockSessionCommand,
  ): AsyncResult<LocalUnlockSessionRefresh>;
}

const STORAGE_OPERATION = {
  READ: "read",
  SAVE: "save",
  DELETE: "delete",
  REFRESH: "refresh",
} as const;

type StorageOperation =
  (typeof STORAGE_OPERATION)[keyof typeof STORAGE_OPERATION];

const READ_WRITE_TRANSACTION_MODE = "rw";

async function attempt_session_storage<T>(
  operation: StorageOperation,
  run: () => Promise<T>,
): AsyncResult<T> {
  try {
    return create_success_result(await run());
  } catch (error) {
    console.error("[LocalVault] Unlock session storage failed", {
      event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_STORAGE_FAILED,
      operation,
      error: String(error),
    });
    return create_failure_result(LOCAL_VAULT_MESSAGE.STORAGE_FAILED);
  }
}

async function read_session_record(
  database: LocalVaultDatabase,
): Promise<Option<LocalUnlockSessionRecord>> {
  const record = await database.unlock_session.get(
    LOCAL_UNLOCK_SESSION_RECORD_ID,
  );
  return record ? create_some_option(record) : create_none_option();
}

async function refresh_session_record(
  database: LocalVaultDatabase,
  command: RefreshLocalUnlockSessionCommand,
): Promise<LocalUnlockSessionRefresh> {
  const record = await database.unlock_session.get(
    LOCAL_UNLOCK_SESSION_RECORD_ID,
  );
  if (!record) return { kind: LOCAL_UNLOCK_SESSION_REFRESH.MISSING };
  if (command.is_expired(record, command.now)) {
    await database.unlock_session.delete(LOCAL_UNLOCK_SESSION_RECORD_ID);
    return { kind: LOCAL_UNLOCK_SESSION_REFRESH.EXPIRED };
  }
  await database.unlock_session.put({
    ...record,
    ...mark_local_unlock_session_seen(record, command.now, command.is_in_sight),
  });
  return { kind: LOCAL_UNLOCK_SESSION_REFRESH.REFRESHED, record };
}

export function create_local_unlock_session_storage(
  database: LocalVaultDatabase,
): LocalUnlockSessionStorage {
  return {
    read_record: () =>
      attempt_session_storage(STORAGE_OPERATION.READ, () =>
        read_session_record(database),
      ),
    save_record: (record: LocalUnlockSessionRecord) =>
      attempt_session_storage(STORAGE_OPERATION.SAVE, async () => {
        await database.unlock_session.put(record);
        return true;
      }),
    delete_record: () =>
      attempt_session_storage(STORAGE_OPERATION.DELETE, async () => {
        await database.unlock_session.delete(LOCAL_UNLOCK_SESSION_RECORD_ID);
        return true;
      }),
    refresh_record: (command: RefreshLocalUnlockSessionCommand) =>
      attempt_session_storage(STORAGE_OPERATION.REFRESH, () =>
        database.transaction(
          READ_WRITE_TRANSACTION_MODE,
          database.unlock_session,
          () => refresh_session_record(database, command),
        ),
      ),
  };
}
