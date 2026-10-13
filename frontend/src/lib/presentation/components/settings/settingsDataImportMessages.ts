import {
  type BlockedRecoverableSessionSyncMarkerSafetyStatus,
  RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

const SAFETY_STATUS = RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS;

export const SESSION_BLOCKED_MESSAGES: Record<
  BlockedRecoverableSessionSyncMarkerSafetyStatus,
  string
> = {
  [SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH]:
    "This backup was created in a different signed-in session and cannot be restored here.",
  [SAFETY_STATUS.BLOCKED_SIGNED_OUT_VERIFIED_BACKUP]:
    "This backup belongs to a signed-in session and cannot be restored while signed out.",
  [SAFETY_STATUS.BLOCKED_SIGNED_OUT_UNMARKED_BACKUP]:
    "This backup has no session information, so it cannot be restored safely.",
  [SAFETY_STATUS.BLOCKED_ACTIVE_USER_MISMATCH]:
    "This backup belongs to a different account. Sign in with the account that created it to restore it.",
  [SAFETY_STATUS.BLOCKED_ACTIVE_USER_UNRESOLVED]:
    "We could not confirm which account is signed in. Reload the page and try the import again.",
  [SAFETY_STATUS.BLOCKED_LEGACY_SESSION_MISMATCH]:
    "This backup was made by an older version of the app and is tied to an earlier sign-in, so it cannot be verified as yours. Export a new backup to move data between sign-ins.",
};
