import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  type ActiveClerkIdentityState,
} from "./activeClerkIdentity";
import {
  build_anonymous_session_sync_marker,
  build_verified_session_sync_marker,
  build_verified_user_session_sync_marker,
  SESSION_SYNC_STATE_STATUS,
  type SessionSyncState,
  type StoredSessionSyncMarker,
} from "./sessionSyncMarker";

export function build_session_sync_marker_for_identity(
  identity: ActiveClerkIdentityState,
): StoredSessionSyncMarker {
  switch (identity.status) {
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT:
      return build_anonymous_session_sync_marker();
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN:
      return build_verified_user_session_sync_marker(
        identity.session_id,
        identity.user_id,
      );
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED:
      return build_verified_session_sync_marker(identity.session_id);
  }
}

function was_synced_by_session(
  session_sync_state: SessionSyncState,
  active_session_id: string,
): boolean {
  switch (session_sync_state.status) {
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
      return session_sync_state.session_id === active_session_id;
    case SESSION_SYNC_STATE_STATUS.MISSING:
    case SESSION_SYNC_STATE_STATUS.ANONYMOUS:
    case SESSION_SYNC_STATE_STATUS.LEGACY:
      return false;
  }
}

export function has_identity_completed_session_sync(
  session_sync_state: SessionSyncState,
  identity: ActiveClerkIdentityState,
): boolean {
  switch (identity.status) {
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT:
      return session_sync_state.status !== SESSION_SYNC_STATE_STATUS.MISSING;
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN:
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED:
      return was_synced_by_session(session_sync_state, identity.session_id);
  }
}
