import type { Transaction } from "dexie";

import { create_none_option } from "$lib/core/types/Option";

import { build_pending_outbox_entry } from "./syncOutboxEntryBuilder";
import {
  SYNC_OUTBOX_TABLE_NAME,
  type SyncOutboxEntry,
  SyncOutboxOperation,
} from "./syncOutboxTypes";

export const LEGACY_SYNC_METADATA_SETTING_KEY = "convex_sync_metadata";
const APP_SETTINGS_TABLE_NAME = "app_settings";

interface LegacyOutboxMigrationDependencies {
  tracked_table_names: readonly string[];
  generate_change_token(): string;
  now_iso(): string;
}

function build_legacy_entries(
  dependencies: LegacyOutboxMigrationDependencies,
  table_name: string,
  local_ids: string[],
): SyncOutboxEntry[] {
  return local_ids.map((local_id) =>
    build_pending_outbox_entry({
      table_name,
      local_id,
      operation: SyncOutboxOperation.UPSERT,
      existing_entry: create_none_option(),
      known_server_version: create_none_option(),
      change_token: dependencies.generate_change_token(),
      enqueued_at: dependencies.now_iso(),
    }),
  );
}

async function enqueue_legacy_table(
  transaction: Transaction,
  dependencies: LegacyOutboxMigrationDependencies,
  table_name: string,
): Promise<number> {
  const existing_table_names = transaction.storeNames;
  if (!existing_table_names.includes(table_name)) return 0;
  const local_ids = (
    await transaction.table(table_name).toCollection().primaryKeys()
  ).map(String);
  await transaction
    .table(SYNC_OUTBOX_TABLE_NAME)
    .bulkPut(build_legacy_entries(dependencies, table_name, local_ids));
  return local_ids.length;
}

async function migrate_legacy_records(
  transaction: Transaction,
  dependencies: LegacyOutboxMigrationDependencies,
): Promise<number> {
  const correlation_id = dependencies.generate_change_token();
  let enqueued_count = 0;
  for (const table_name of dependencies.tracked_table_names)
    enqueued_count += await enqueue_legacy_table(
      transaction,
      dependencies,
      table_name,
    );
  await transaction
    .table(APP_SETTINGS_TABLE_NAME)
    .delete(LEGACY_SYNC_METADATA_SETTING_KEY);
  console.log("[SyncOutbox] Legacy local records queued for push", {
    event: "sync_outbox_legacy_migration_completed",
    correlation_id,
    enqueued_count,
  });
  return enqueued_count;
}

export function create_legacy_outbox_migration(
  dependencies: LegacyOutboxMigrationDependencies,
): (transaction: Transaction) => Promise<number> {
  return (transaction: Transaction): Promise<number> =>
    migrate_legacy_records(transaction, dependencies);
}
