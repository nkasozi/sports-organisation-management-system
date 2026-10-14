import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  type ActiveClerkIdentityState,
} from "./activeClerkIdentity";
import {
  DEVICE_SESSION_STATUS,
  type DeviceSessionState,
  type VerifiedSessionSyncState,
} from "./deviceSessionState";
import { SESSION_SYNC_STATE_STATUS } from "./sessionSyncMarker";

function identity_from_verified_sync(
  verified_sync: VerifiedSessionSyncState,
): ActiveClerkIdentityState {
  switch (verified_sync.status) {
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
      return {
        status: ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN,
        session_id: verified_sync.session_id,
        user_id: verified_sync.user_id,
      };
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
      return {
        status: ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED,
        session_id: verified_sync.session_id,
      };
  }
}

export function resolve_backup_owner_identity(
  device_session: DeviceSessionState,
): ActiveClerkIdentityState {
  switch (device_session.status) {
    case DEVICE_SESSION_STATUS.SIGNED_IN:
      return device_session.identity;
    case DEVICE_SESSION_STATUS.OFFLINE_VERIFIED:
      return identity_from_verified_sync(device_session.verified_sync);
    case DEVICE_SESSION_STATUS.SESSION_ENDED:
    case DEVICE_SESSION_STATUS.ANONYMOUS:
      return { status: ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT };
  }
}
