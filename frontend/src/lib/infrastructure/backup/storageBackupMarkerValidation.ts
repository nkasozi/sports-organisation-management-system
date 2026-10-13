import {
  RECOVERABLE_SESSION_SYNC_MARKER_STATUS,
  type RecoverableSessionSyncMarkerState,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";
import {
  ANONYMOUS_SESSION_SYNC_MODE,
  is_non_empty_marker_identifier,
  VERIFIED_SESSION_SYNC_MODE,
  VERIFIED_USER_SESSION_SYNC_MODE,
} from "$lib/presentation/stores/sessionSyncMarker";

const OBJECT_TYPE_NAME = "object";

function is_object_value(value: unknown): value is Record<string, unknown> {
  return typeof value === OBJECT_TYPE_NAME && value !== null;
}

function is_recoverable_session_sync_marker(value: unknown): boolean {
  if (!is_object_value(value)) {
    return false;
  }

  switch (value.mode) {
    case ANONYMOUS_SESSION_SYNC_MODE:
      return true;
    case VERIFIED_SESSION_SYNC_MODE:
      return is_non_empty_marker_identifier(value.session_id);
    case VERIFIED_USER_SESSION_SYNC_MODE:
      return (
        is_non_empty_marker_identifier(value.session_id) &&
        is_non_empty_marker_identifier(value.user_id)
      );
    default:
      return false;
  }
}

export function is_recoverable_session_sync_marker_state(
  value: unknown,
): value is RecoverableSessionSyncMarkerState {
  if (!is_object_value(value)) {
    return false;
  }

  switch (value.status) {
    case RECOVERABLE_SESSION_SYNC_MARKER_STATUS.MISSING:
      return true;
    case RECOVERABLE_SESSION_SYNC_MARKER_STATUS.PRESENT:
      return is_recoverable_session_sync_marker(value.marker);
    default:
      return false;
  }
}
