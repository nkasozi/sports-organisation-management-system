import type { Transaction } from "dexie";

export const LEGACY_SYNC_METADATA_SETTING_KEY = "convex_sync_metadata";
const APP_SETTINGS_TABLE_NAME = "app_settings";

interface LegacyOutboxMigrationDependencies {
  tracked_table_names: readonly string[];
  generate_change_token(): string;
  now_iso(): string;
}

async function count_legacy_table_records(
  transaction: Transaction,
  table_name: string,
): Promise<number> {
  if (!transaction.storeNames.includes(table_name)) return 0;
  return transaction.table(table_name).count();
}

async function count_legacy_records(
  transaction: Transaction,
  tracked_table_names: readonly string[],
): Promise<number> {
  let legacy_record_count = 0;
  for (const table_name of tracked_table_names)
    legacy_record_count += await count_legacy_table_records(
      transaction,
      table_name,
    );
  return legacy_record_count;
}

async function migrate_legacy_records(
  transaction: Transaction,
  dependencies: LegacyOutboxMigrationDependencies,
): Promise<number> {
  const legacy_record_count = await count_legacy_records(
    transaction,
    dependencies.tracked_table_names,
  );
  await transaction
    .table(APP_SETTINGS_TABLE_NAME)
    .delete(LEGACY_SYNC_METADATA_SETTING_KEY);
  console.log(
    "[SyncOutbox] Legacy records were not queued; the server pull reconciles them",
    {
      event: "sync_outbox_legacy_migration_enqueue_skipped",
      correlation_id: dependencies.generate_change_token(),
      migrated_at: dependencies.now_iso(),
      legacy_record_count,
    },
  );
  return 0;
}

export function create_legacy_outbox_migration(
  dependencies: LegacyOutboxMigrationDependencies,
): (transaction: Transaction) => Promise<number> {
  return (transaction: Transaction): Promise<number> =>
    migrate_legacy_records(transaction, dependencies);
}
