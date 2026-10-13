import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  type ActiveClerkIdentityState,
} from "./activeClerkIdentity";
import {
  ANONYMOUS_SESSION_SYNC_MODE,
  build_verified_user_session_sync_marker,
  type StoredSessionSyncMarker,
  VERIFIED_SESSION_SYNC_MODE,
  VERIFIED_USER_SESSION_SYNC_MODE,
} from "./sessionSyncMarker";

export const RECOVERABLE_SESSION_SYNC_MARKER_STATUS = {
  MISSING: "missing",
  PRESENT: "present",
} as const;

export const RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS = {
  SAFE_SIGNED_OUT_ANONYMOUS_BACKUP: "safe_signed_out_anonymous_backup",
  SAFE_MATCHING_VERIFIED_SESSION: "safe_matching_verified_session",
  SAFE_MATCHING_VERIFIED_USER: "safe_matching_verified_user",
  BLOCKED_ACTIVE_SESSION_MISMATCH: "blocked_active_session_mismatch",
  BLOCKED_ACTIVE_USER_MISMATCH: "blocked_active_user_mismatch",
  BLOCKED_ACTIVE_USER_UNRESOLVED: "blocked_active_user_unresolved",
  BLOCKED_LEGACY_SESSION_MISMATCH: "blocked_legacy_session_mismatch",
  BLOCKED_SIGNED_OUT_VERIFIED_BACKUP: "blocked_signed_out_verified_backup",
  BLOCKED_SIGNED_OUT_UNMARKED_BACKUP: "blocked_signed_out_unmarked_backup",
} as const;

const MARKER_STATUS = RECOVERABLE_SESSION_SYNC_MARKER_STATUS;
const SAFETY_STATUS = RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS;
const IDENTITY_STATUS = ACTIVE_CLERK_IDENTITY_STATUS;

export type RecoverableSessionSyncMarker = StoredSessionSyncMarker;

export type RecoverableSessionSyncMarkerState =
  | { status: typeof MARKER_STATUS.MISSING }
  | {
      status: typeof MARKER_STATUS.PRESENT;
      marker: RecoverableSessionSyncMarker;
    };

export type BlockedRecoverableSessionSyncMarkerSafetyStatus =
  | typeof SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH
  | typeof SAFETY_STATUS.BLOCKED_ACTIVE_USER_MISMATCH
  | typeof SAFETY_STATUS.BLOCKED_ACTIVE_USER_UNRESOLVED
  | typeof SAFETY_STATUS.BLOCKED_LEGACY_SESSION_MISMATCH
  | typeof SAFETY_STATUS.BLOCKED_SIGNED_OUT_VERIFIED_BACKUP
  | typeof SAFETY_STATUS.BLOCKED_SIGNED_OUT_UNMARKED_BACKUP;

export type RecoverableSessionSyncMarkerSafety =
  | { status: typeof SAFETY_STATUS.SAFE_SIGNED_OUT_ANONYMOUS_BACKUP }
  | {
      status: typeof SAFETY_STATUS.SAFE_MATCHING_VERIFIED_SESSION;
      session_id: string;
    }
  | {
      status: typeof SAFETY_STATUS.SAFE_MATCHING_VERIFIED_USER;
      session_id: string;
      user_id: string;
    }
  | { status: BlockedRecoverableSessionSyncMarkerSafetyStatus };

type SignedInIdentity = Exclude<
  ActiveClerkIdentityState,
  { status: typeof IDENTITY_STATUS.SIGNED_OUT }
>;

function classify_signed_out_marker_safety(
  marker_state: RecoverableSessionSyncMarkerState,
): RecoverableSessionSyncMarkerSafety {
  if (marker_state.status === MARKER_STATUS.MISSING)
    return { status: SAFETY_STATUS.BLOCKED_SIGNED_OUT_UNMARKED_BACKUP };
  return marker_state.marker.mode === ANONYMOUS_SESSION_SYNC_MODE
    ? { status: SAFETY_STATUS.SAFE_SIGNED_OUT_ANONYMOUS_BACKUP }
    : { status: SAFETY_STATUS.BLOCKED_SIGNED_OUT_VERIFIED_BACKUP };
}

function classify_legacy_session_marker_safety(
  marker_session_id: string,
  identity: SignedInIdentity,
): RecoverableSessionSyncMarkerSafety {
  return marker_session_id === identity.session_id
    ? {
        status: SAFETY_STATUS.SAFE_MATCHING_VERIFIED_SESSION,
        session_id: identity.session_id,
      }
    : { status: SAFETY_STATUS.BLOCKED_LEGACY_SESSION_MISMATCH };
}

function classify_user_marker_safety(
  marker_user_id: string,
  identity: SignedInIdentity,
): RecoverableSessionSyncMarkerSafety {
  if (identity.status === IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED)
    return { status: SAFETY_STATUS.BLOCKED_ACTIVE_USER_UNRESOLVED };
  return marker_user_id === identity.user_id
    ? {
        status: SAFETY_STATUS.SAFE_MATCHING_VERIFIED_USER,
        session_id: identity.session_id,
        user_id: identity.user_id,
      }
    : { status: SAFETY_STATUS.BLOCKED_ACTIVE_USER_MISMATCH };
}

function classify_signed_in_marker_safety(
  marker_state: RecoverableSessionSyncMarkerState,
  identity: SignedInIdentity,
): RecoverableSessionSyncMarkerSafety {
  if (marker_state.status === MARKER_STATUS.MISSING)
    return { status: SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH };
  const { marker } = marker_state;
  switch (marker.mode) {
    case VERIFIED_USER_SESSION_SYNC_MODE:
      return classify_user_marker_safety(marker.user_id, identity);
    case VERIFIED_SESSION_SYNC_MODE:
      return classify_legacy_session_marker_safety(marker.session_id, identity);
    case ANONYMOUS_SESSION_SYNC_MODE:
      return { status: SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH };
  }
}

export function classify_recoverable_session_sync_marker_safety(
  marker_state: RecoverableSessionSyncMarkerState,
  identity: ActiveClerkIdentityState,
): RecoverableSessionSyncMarkerSafety {
  return identity.status === IDENTITY_STATUS.SIGNED_OUT
    ? classify_signed_out_marker_safety(marker_state)
    : classify_signed_in_marker_safety(marker_state, identity);
}

export function is_recoverable_session_sync_marker_safety_blocking(
  safety: RecoverableSessionSyncMarkerSafety,
): safety is { status: BlockedRecoverableSessionSyncMarkerSafetyStatus } {
  switch (safety.status) {
    case SAFETY_STATUS.SAFE_SIGNED_OUT_ANONYMOUS_BACKUP:
    case SAFETY_STATUS.SAFE_MATCHING_VERIFIED_SESSION:
    case SAFETY_STATUS.SAFE_MATCHING_VERIFIED_USER:
      return false;
    case SAFETY_STATUS.BLOCKED_ACTIVE_SESSION_MISMATCH:
    case SAFETY_STATUS.BLOCKED_ACTIVE_USER_MISMATCH:
    case SAFETY_STATUS.BLOCKED_ACTIVE_USER_UNRESOLVED:
    case SAFETY_STATUS.BLOCKED_LEGACY_SESSION_MISMATCH:
    case SAFETY_STATUS.BLOCKED_SIGNED_OUT_VERIFIED_BACKUP:
    case SAFETY_STATUS.BLOCKED_SIGNED_OUT_UNMARKED_BACKUP:
      return true;
  }
}

export function resolve_restored_session_sync_marker_state(
  backup_marker_state: RecoverableSessionSyncMarkerState,
  safety: RecoverableSessionSyncMarkerSafety,
): RecoverableSessionSyncMarkerState {
  if (safety.status !== SAFETY_STATUS.SAFE_MATCHING_VERIFIED_USER)
    return backup_marker_state;
  return {
    status: MARKER_STATUS.PRESENT,
    marker: build_verified_user_session_sync_marker(
      safety.session_id,
      safety.user_id,
    ),
  };
}
