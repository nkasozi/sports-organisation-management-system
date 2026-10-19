export const LOCAL_VAULT_MESSAGE = {
  PASSKEY_CANCELLED: "Fingerprint unlock was cancelled.",
  PASSKEY_UNAVAILABLE:
    "This device can't use fingerprint unlock. Use a PIN instead.",
  PASSKEY_FAILED: "Fingerprint unlock didn't work. Please try again.",
  PASSKEY_WRONG_SECRET: "That fingerprint didn't unlock this device.",
  PIN_TOO_SHORT: "Use a PIN of at least 6 digits or characters.",
  PIN_WRONG: "That PIN didn't unlock this device.",
  DEVICE_KEY_FAILED: "This device couldn't open its saved data.",
  NO_VAULT: "This device hasn't been set up to protect its saved data yet.",
  WRONG_MODE_DEVICE: "This device is not protected by an automatic key.",
  WRONG_MODE_PASSKEY: "This device is not protected by fingerprint unlock.",
  WRONG_MODE_PIN: "This device is not protected by a PIN.",
  STORAGE_FAILED: "This device couldn't read or save its protection settings.",
  KEY_SETUP_FAILED: "This device couldn't set up protection for its data.",
  NO_UNLOCK_SESSION: "There is no recent unlock to pick up on this device.",
  UNLOCK_SESSION_EXPIRED: "The last unlock on this device has expired.",
  UNLOCK_SESSION_WRONG_MODE:
    "This device's data is not protected by an unlock.",
} as const;

export const LOCAL_VAULT_LOG_EVENT = {
  STORAGE_READ_FAILED: "local_vault_storage_read_failed",
  STORAGE_SAVE_FAILED: "local_vault_storage_save_failed",
  STORAGE_DELETE_FAILED: "local_vault_storage_delete_failed",
  KEY_WRAP_FAILED: "local_vault_key_wrap_failed",
  KEY_UNWRAP_FAILED: "local_vault_key_unwrap_failed",
  WRAPPING_KEY_FAILED: "local_vault_wrapping_key_failed",
  PASSKEY_AVAILABILITY_FAILED: "local_vault_passkey_availability_failed",
  PASSKEY_REQUEST_FAILED: "local_vault_passkey_request_failed",
  PASSKEY_WITHOUT_PRF: "local_vault_passkey_without_prf",
  VAULT_ACTIVATED: "local_vault_activated",
  VAULT_UNLOCKED: "local_vault_unlocked",
  VAULT_LOCKED: "local_vault_locked",
  UNLOCK_SESSION_STARTED: "local_unlock_session_started",
  UNLOCK_SESSION_START_FAILED: "local_unlock_session_start_failed",
  UNLOCK_SESSION_RESUMED: "local_unlock_session_resumed",
  UNLOCK_SESSION_NOT_RESUMED: "local_unlock_session_not_resumed",
  UNLOCK_SESSION_ENDED: "local_unlock_session_ended",
  UNLOCK_SESSION_OVER: "local_unlock_session_over",
  UNLOCK_SESSION_SKIPPED: "local_unlock_session_skipped",
  UNLOCK_SESSION_END_FAILED: "local_unlock_session_end_failed",
  UNLOCK_SESSION_STORAGE_FAILED: "local_unlock_session_storage_failed",
} as const;

export type LocalVaultLogEvent =
  (typeof LOCAL_VAULT_LOG_EVENT)[keyof typeof LOCAL_VAULT_LOG_EVENT];
