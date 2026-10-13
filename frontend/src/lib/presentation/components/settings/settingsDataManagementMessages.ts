export type SettingsToastType = "success" | "error" | "info";
export type ShowToast = (message: string, type: SettingsToastType) => void;

export const TOAST_TYPE_SUCCESS: SettingsToastType = "success";
export const TOAST_TYPE_ERROR: SettingsToastType = "error";

export const BACKUP_EXPORT_SUCCESS_MESSAGE = "Backup exported successfully";
export const BACKUP_IMPORT_SUCCESS_MESSAGE =
  "Backup imported successfully. Reloading application...";
export const BACKUP_FILE_UNREADABLE_ERROR = "Backup file could not be read";
export const FILE_NAME_PREFIX = "sports-org-backup-";
export const FILE_NAME_SUFFIX = ".json";
export const SUPPORTED_BACKUP_MESSAGE =
  "Automatic device backups are stored inside this browser's own storage. They only help recover from local database corruption and are erased together with this site's data if browser data is cleared. Use Export All Data to keep a backup file outside this browser.";
export const UNSUPPORTED_BACKUP_MESSAGE =
  "Automatic device backups are unavailable in this browser. Use Export All Data to keep a backup file outside this browser.";
