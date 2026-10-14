import { resolve_current_device_session } from "./deviceSessionStateResolution";
import { resolve_backup_owner_identity } from "./recoverableSessionSyncMarkerDeviceIdentity";
import {
  classify_recoverable_session_sync_marker_safety,
  RECOVERABLE_SESSION_SYNC_MARKER_STATUS,
  type RecoverableSessionSyncMarkerSafety,
  type RecoverableSessionSyncMarkerState,
} from "./recoverableSessionSyncMarkerSafety";
import {
  build_anonymous_session_sync_marker,
  build_verified_session_sync_marker,
  build_verified_user_session_sync_marker,
  read_session_sync_state_from_storage,
  remove_session_sync_marker,
  SESSION_SYNC_STATE_STATUS,
  type SessionSyncState,
  write_session_sync_marker,
} from "./sessionSyncMarker";

export {
  type BlockedRecoverableSessionSyncMarkerSafetyStatus,
  classify_recoverable_session_sync_marker_safety,
  is_recoverable_session_sync_marker_safety_blocking,
  RECOVERABLE_SESSION_SYNC_MARKER_SAFETY_STATUS,
  RECOVERABLE_SESSION_SYNC_MARKER_STATUS,
  type RecoverableSessionSyncMarkerSafety,
  type RecoverableSessionSyncMarkerState,
  resolve_restored_session_sync_marker_state,
} from "./recoverableSessionSyncMarkerSafety";

const MARKER_STATUS = RECOVERABLE_SESSION_SYNC_MARKER_STATUS;

function convert_session_sync_state_to_recoverable_marker_state(
  session_sync_state: SessionSyncState,
): RecoverableSessionSyncMarkerState {
  switch (session_sync_state.status) {
    case SESSION_SYNC_STATE_STATUS.ANONYMOUS:
      return {
        status: MARKER_STATUS.PRESENT,
        marker: build_anonymous_session_sync_marker(),
      };
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
      return {
        status: MARKER_STATUS.PRESENT,
        marker: build_verified_session_sync_marker(
          session_sync_state.session_id,
        ),
      };
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
      return {
        status: MARKER_STATUS.PRESENT,
        marker: build_verified_user_session_sync_marker(
          session_sync_state.session_id,
          session_sync_state.user_id,
        ),
      };
    case SESSION_SYNC_STATE_STATUS.MISSING:
    case SESSION_SYNC_STATE_STATUS.LEGACY:
      return { status: MARKER_STATUS.MISSING };
  }
}

export async function get_recoverable_session_sync_marker_state(): Promise<RecoverableSessionSyncMarkerState> {
  const session_sync_state = await read_session_sync_state_from_storage();

  return convert_session_sync_state_to_recoverable_marker_state(
    session_sync_state,
  );
}

export async function persist_recoverable_session_sync_marker_state(
  marker_state: RecoverableSessionSyncMarkerState,
): Promise<boolean> {
  return marker_state.status === MARKER_STATUS.MISSING
    ? remove_session_sync_marker()
    : write_session_sync_marker(marker_state.marker);
}

export async function evaluate_recoverable_session_sync_marker_state(
  marker_state: RecoverableSessionSyncMarkerState,
): Promise<RecoverableSessionSyncMarkerSafety> {
  return classify_recoverable_session_sync_marker_safety(
    marker_state,
    resolve_backup_owner_identity(await resolve_current_device_session()),
  );
}
