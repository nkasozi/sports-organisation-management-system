import Dexie, { type Table } from "dexie";

import type {
  LocalUnlockSessionRecord,
  LocalVaultRecord,
} from "./localVaultContracts";

export const LOCAL_VAULT_DATABASE_NAME = "SportSyncVault";
const LOCAL_VAULT_TABLE_NAME = "vault";
const LOCAL_UNLOCK_SESSION_TABLE_NAME = "unlock_session";
const LOCAL_VAULT_SCHEMA_VERSION = 2;
const LOCAL_VAULT_TABLE_SCHEMA = "id";

export class LocalVaultDatabase extends Dexie {
  vault!: Table<LocalVaultRecord, string>;
  unlock_session!: Table<LocalUnlockSessionRecord, string>;

  constructor(database_name: string) {
    super(database_name);
    this.version(LOCAL_VAULT_SCHEMA_VERSION).stores({
      [LOCAL_VAULT_TABLE_NAME]: LOCAL_VAULT_TABLE_SCHEMA,
      [LOCAL_UNLOCK_SESSION_TABLE_NAME]: LOCAL_VAULT_TABLE_SCHEMA,
    });
  }
}

export function create_local_vault_database(
  database_name: string,
): LocalVaultDatabase {
  return new LocalVaultDatabase(database_name);
}
