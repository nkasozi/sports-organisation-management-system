export const DEVICE_BACKUP_CAPABILITY_STATUS = {
  SUPPORTED: "supported",
  UNSUPPORTED: "unsupported",
} as const;

export const DEVICE_BACKUP_READ_STATUS = {
  AVAILABLE: "available",
  FAILED: "failed",
  MISSING: "missing",
  UNSUPPORTED: "unsupported",
} as const;

export const DEVICE_BACKUP_DELETE_STATUS = {
  DELETED: "deleted",
  ALREADY_MISSING: "already_missing",
  UNSUPPORTED: "unsupported",
  FAILED: "failed",
} as const;

export const DEVICE_BACKUP_WRITE_STATUS = {
  WRITTEN: "written",
  SKIPPED_NOT_RESTORABLE: "skipped_not_restorable",
  SKIPPED_WRITER_CLOSED: "skipped_writer_closed",
} as const;

export const PENDING_LOCAL_CHANGE_STATUS = {
  NO_PENDING_LOCAL_CHANGES: "no_pending_local_changes",
  PENDING_LOCAL_CHANGES_PRESENT: "pending_local_changes_present",
  COUNT_UNAVAILABLE: "count_unavailable",
} as const;

export const STORAGE_STARTUP_RECOVERY_STATUS = {
  BACKUP_MISSING: "backup_missing",
  DEVICE_BACKUP_READ_FAILED: "device_backup_read_failed",
  DEVICE_BACKUP_UNSUPPORTED: "device_backup_unsupported",
  INVALID_DEVICE_BACKUP: "invalid_device_backup",
  LOCAL_DATA_PRESENT: "local_data_present",
  RESTORE_AVAILABLE: "restore_available",
  RESTORE_BLOCKED: "restore_blocked",
} as const;

export const STORAGE_BACKUP_SOURCE = {
  DEVICE_AUTOMATIC: "device_automatic",
  MANUAL_EXPORT: "manual_export",
} as const;
