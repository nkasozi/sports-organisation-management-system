import type {
  StorageBackupSummary,
  StorageStartupRecoveryState,
} from "$lib/infrastructure/backup/storageBackupContracts";
import { STORAGE_STARTUP_RECOVERY_STATUS } from "$lib/infrastructure/backup/storageBackupStatus";
import {
  type BlockedRecoverableSessionSyncMarkerSafetyStatus,
  RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

export const STARTUP_STORAGE_RECOVERY_CHOICE = {
  CONTINUE: "continue",
  RESTORE: "restore",
} as const;

export const STARTUP_STORAGE_RECOVERY_PROMPT_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

export const STARTUP_STORAGE_RECOVERY_PROMPT_MODE = {
  AVAILABLE: "available",
  BLOCKED: "blocked",
  FAILED: "failed",
} as const;

const PROMPT_STATUS = STARTUP_STORAGE_RECOVERY_PROMPT_STATUS;
const PROMPT_MODE = STARTUP_STORAGE_RECOVERY_PROMPT_MODE;
const SAFETY_STATUS = RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS;

const FAILED_PROMPT_MESSAGE =
  "The local device backup could not be restored, so the data on this device was left as it was. Continue to start the app; you can import a backup file later from Settings.";
const PROMPT_TITLES: Record<StartupStorageRecoveryPromptMode, string> = {
  [PROMPT_MODE.AVAILABLE]: "Local Backup Found",
  [PROMPT_MODE.BLOCKED]: "Local Backup Requires Review",
  [PROMPT_MODE.FAILED]: "Local Backup Restore Failed",
};
const AVAILABLE_PROMPT_MESSAGE =
  "A local device backup from this browser is available. Restore it before the app finishes starting?";
const BLOCKED_PROMPT_MESSAGES: Record<
  BlockedRecoverableSessionSyncMarkerSafetyStatus,
  string
> = {
  [SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH]:
    "This local device backup belongs to a different signed-in session. Continue fresh now and import it manually later if needed.",
  [SAFETY_STATUS.BLOCKED_SIGNED_OUT_VERIFIED_BACKUP]:
    "This local device backup belongs to a signed-in session and cannot be restored while signed out.",
  [SAFETY_STATUS.BLOCKED_SIGNED_OUT_UNMARKED_BACKUP]:
    "This local device backup has no session information and cannot be restored safely.",
  [SAFETY_STATUS.BLOCKED_ACTIVE_USER_MISMATCH]:
    "This local device backup belongs to a different account. Sign in with the account that created it to restore it.",
  [SAFETY_STATUS.BLOCKED_ACTIVE_USER_UNRESOLVED]:
    "We could not confirm which account is signed in, so this local device backup cannot be restored yet. Reload the page and try again.",
  [SAFETY_STATUS.BLOCKED_LEGACY_SESSION_MISMATCH]:
    "This local device backup was made by an older version of the app and is tied to an earlier sign-in, so it cannot be verified as yours. Continue fresh; your account data will sync from the server.",
};

type StartupStorageRecoveryPromptMode =
  (typeof STARTUP_STORAGE_RECOVERY_PROMPT_MODE)[keyof typeof STARTUP_STORAGE_RECOVERY_PROMPT_MODE];

export type StartupStorageRecoveryChoice =
  (typeof STARTUP_STORAGE_RECOVERY_CHOICE)[keyof typeof STARTUP_STORAGE_RECOVERY_CHOICE];

export type VisibleStartupStorageRecoveryPromptState =
  | {
      status: typeof PROMPT_STATUS.VISIBLE;
      mode: typeof PROMPT_MODE.AVAILABLE;
      summary: StorageBackupSummary;
    }
  | {
      status: typeof PROMPT_STATUS.VISIBLE;
      mode: typeof PROMPT_MODE.BLOCKED;
      summary: StorageBackupSummary;
      safety_status: BlockedRecoverableSessionSyncMarkerSafetyStatus;
    }
  | {
      status: typeof PROMPT_STATUS.VISIBLE;
      mode: typeof PROMPT_MODE.FAILED;
      summary: StorageBackupSummary;
    };

export type StartupStorageRecoveryPromptState =
  | { status: typeof PROMPT_STATUS.HIDDEN }
  | VisibleStartupStorageRecoveryPromptState;

export function create_hidden_startup_storage_recovery_prompt_state(): StartupStorageRecoveryPromptState {
  return { status: PROMPT_STATUS.HIDDEN };
}

export function build_startup_storage_recovery_prompt_state(
  recovery_state: StorageStartupRecoveryState,
): StartupStorageRecoveryPromptState {
  switch (recovery_state.status) {
    case STORAGE_STARTUP_RECOVERY_STATUS.RESTORE_AVAILABLE:
      return {
        status: PROMPT_STATUS.VISIBLE,
        mode: PROMPT_MODE.AVAILABLE,
        summary: recovery_state.summary,
      };
    case STORAGE_STARTUP_RECOVERY_STATUS.RESTORE_BLOCKED:
      return {
        status: PROMPT_STATUS.VISIBLE,
        mode: PROMPT_MODE.BLOCKED,
        summary: recovery_state.summary,
        safety_status: recovery_state.safety_status,
      };
    case STORAGE_STARTUP_RECOVERY_STATUS.BACKUP_MISSING:
    case STORAGE_STARTUP_RECOVERY_STATUS.DEVICE_BACKUP_READ_FAILED:
    case STORAGE_STARTUP_RECOVERY_STATUS.DEVICE_BACKUP_UNSUPPORTED:
    case STORAGE_STARTUP_RECOVERY_STATUS.INVALID_DEVICE_BACKUP:
    case STORAGE_STARTUP_RECOVERY_STATUS.LOCAL_DATA_PRESENT:
      return create_hidden_startup_storage_recovery_prompt_state();
  }
}

export function get_startup_storage_recovery_prompt_message(
  prompt_state: VisibleStartupStorageRecoveryPromptState,
): string {
  switch (prompt_state.mode) {
    case PROMPT_MODE.AVAILABLE:
      return AVAILABLE_PROMPT_MESSAGE;
    case PROMPT_MODE.BLOCKED:
      return BLOCKED_PROMPT_MESSAGES[prompt_state.safety_status];
    case PROMPT_MODE.FAILED:
      return FAILED_PROMPT_MESSAGE;
  }
}

export function get_startup_storage_recovery_prompt_title(
  mode: StartupStorageRecoveryPromptMode,
): string {
  return PROMPT_TITLES[mode];
}
