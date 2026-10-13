import type {
  SyncOutboxEntry,
  SyncRecordVersion,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  is_backup_raw_object,
  parse_sync_outbox_entry,
  parse_sync_record_version,
} from "./storageBackupSyncBookkeepingEntries";

const MAXIMUM_STORAGE_BACKUP_SYNC_BOOKKEEPING_ENTRIES = 250000;

const SYNC_BOOKKEEPING_INVALID_ERROR =
  "Backup sync bookkeeping section is invalid";
const SYNC_BOOKKEEPING_DUPLICATED_ERROR =
  "Backup sync bookkeeping contains duplicate keys";
const SYNC_BOOKKEEPING_TOO_LARGE_ERROR =
  "Backup sync bookkeeping exceeds the maximum supported entry count";
const KEY_SEPARATOR = "\u0000";

export interface StorageBackupSyncBookkeeping {
  outbox_entries: SyncOutboxEntry[];
  record_versions: SyncRecordVersion[];
}

interface KeyedBookkeepingEntry {
  table_name: string;
  local_id: string;
}

export function create_empty_storage_backup_sync_bookkeeping(): StorageBackupSyncBookkeeping {
  return { outbox_entries: [], record_versions: [] };
}

function build_bookkeeping_key(entry: KeyedBookkeepingEntry): string {
  return `${entry.table_name}${KEY_SEPARATOR}${entry.local_id}`;
}

function parse_unique_entries<TEntry extends KeyedBookkeepingEntry>(
  value: unknown,
  parse_entry: (candidate: unknown) => Result<TEntry>,
): Result<TEntry[]> {
  if (!Array.isArray(value))
    return create_failure_result(SYNC_BOOKKEEPING_INVALID_ERROR);
  if (value.length > MAXIMUM_STORAGE_BACKUP_SYNC_BOOKKEEPING_ENTRIES)
    return create_failure_result(SYNC_BOOKKEEPING_TOO_LARGE_ERROR);
  const seen_keys = new Set<string>();
  const parsed_entries: TEntry[] = [];
  for (const candidate of value as unknown[]) {
    const entry_result = parse_entry(candidate);
    if (!entry_result.success) return entry_result;
    const entry_key = build_bookkeeping_key(entry_result.data);
    if (seen_keys.has(entry_key))
      return create_failure_result(SYNC_BOOKKEEPING_DUPLICATED_ERROR);
    seen_keys.add(entry_key);
    parsed_entries.push(entry_result.data);
  }
  return create_success_result(parsed_entries);
}

export function parse_storage_backup_sync_bookkeeping(
  value: unknown,
): Result<StorageBackupSyncBookkeeping> {
  if (!is_backup_raw_object(value))
    return create_failure_result(SYNC_BOOKKEEPING_INVALID_ERROR);
  const outbox_entries_result = parse_unique_entries(
    value.outbox_entries,
    parse_sync_outbox_entry,
  );
  if (!outbox_entries_result.success) return outbox_entries_result;
  const record_versions_result = parse_unique_entries(
    value.record_versions,
    parse_sync_record_version,
  );
  if (!record_versions_result.success) return record_versions_result;
  return create_success_result({
    outbox_entries: outbox_entries_result.data,
    record_versions: record_versions_result.data,
  });
}
