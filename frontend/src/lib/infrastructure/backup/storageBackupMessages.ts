export const STORAGE_BACKUP_RESTORE_INVALID_TRANSITION_ERROR =
  "Invalid storage backup restore transition";

export const STORAGE_BACKUP_USER_MESSAGES = {
  DEVICE_BACKUP_UNSUPPORTED: "Device backup storage is unsupported",
  DEVICE_BACKUP_MISSING: "Device backup is missing",
  DEVICE_BACKUP_READ_FAILED:
    "The backup saved on this device could not be read. Please try again.",
  DEVICE_BACKUP_WRITE_FAILED:
    "A backup could not be saved on this device. Please try again.",
  DEVICE_BACKUP_DELETE_FAILED:
    "The backup saved on this device could not be removed.",
  BACKUP_EXPORT_FAILED:
    "Your data could not be exported right now. Please try again.",
  RESTORE_BLOCKED_SESSION: "Backup restore blocked for the current session",
  RESTORE_BLOCKED_PENDING_CHANGES:
    "Backup restore blocked by unsynced local changes",
  RESTORE_BLOCKED_CHANGE_CHECK:
    "Backup restore blocked because unsynced changes could not be checked",
  RESTORE_FAILED: "Storage backup restore failed",
} as const;
