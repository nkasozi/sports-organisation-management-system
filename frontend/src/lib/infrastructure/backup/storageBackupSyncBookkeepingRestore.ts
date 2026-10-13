import {
  LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
  STORAGE_BACKUP_FORMAT_VERSION,
  type StorageBackupEnvelope,
} from "./storageBackupFormat";
import {
  create_empty_storage_backup_sync_bookkeeping,
  type StorageBackupSyncBookkeeping,
} from "./storageBackupSyncBookkeeping";

export function resolve_restorable_sync_bookkeeping(
  envelope: StorageBackupEnvelope,
): StorageBackupSyncBookkeeping {
  switch (envelope.format_version) {
    case STORAGE_BACKUP_FORMAT_VERSION:
      return envelope.sync_bookkeeping;
    case LEGACY_STORAGE_BACKUP_FORMAT_VERSION:
      return create_empty_storage_backup_sync_bookkeeping();
  }
}
