import type { Option } from "$lib/core/types/Option";
import {
  create_none_option,
  create_some_option,
  OptionStatus,
} from "$lib/core/types/Option";

import {
  SESSION_IDENTITY_STATUS,
  type SessionIdentityResolution,
  type SignedInClerkIdentity,
} from "./sessionIdentityResolution";
import {
  SESSION_SYNC_STATE_STATUS,
  type SessionSyncState,
} from "./sessionSyncMarker";

export const DEVICE_SESSION_STATUS = {
  SIGNED_IN: "signed_in",
  OFFLINE_VERIFIED: "offline_verified",
  SESSION_ENDED: "session_ended",
  ANONYMOUS: "anonymous",
} as const;

export type VerifiedSessionSyncState = Extract<
  SessionSyncState,
  {
    status:
      | typeof SESSION_SYNC_STATE_STATUS.VERIFIED_USER
      | typeof SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION;
  }
>;

export type DeviceSessionState =
  | {
      status: typeof DEVICE_SESSION_STATUS.SIGNED_IN;
      identity: SignedInClerkIdentity;
    }
  | {
      status: typeof DEVICE_SESSION_STATUS.OFFLINE_VERIFIED;
      verified_sync: VerifiedSessionSyncState;
    }
  | {
      status: typeof DEVICE_SESSION_STATUS.SESSION_ENDED;
      verified_sync: VerifiedSessionSyncState;
    }
  | { status: typeof DEVICE_SESSION_STATUS.ANONYMOUS };

const ANONYMOUS_DEVICE_SESSION: DeviceSessionState = {
  status: DEVICE_SESSION_STATUS.ANONYMOUS,
};

function find_verified_session_sync(
  session_sync_state: SessionSyncState,
): Option<VerifiedSessionSyncState> {
  switch (session_sync_state.status) {
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
      return create_some_option(session_sync_state);
    case SESSION_SYNC_STATE_STATUS.MISSING:
    case SESSION_SYNC_STATE_STATUS.ANONYMOUS:
    case SESSION_SYNC_STATE_STATUS.LEGACY:
      return create_none_option();
  }
}

function classify_signed_out_device(
  verified_status:
    | typeof DEVICE_SESSION_STATUS.OFFLINE_VERIFIED
    | typeof DEVICE_SESSION_STATUS.SESSION_ENDED,
  session_sync_state: SessionSyncState,
): DeviceSessionState {
  const verified_sync = find_verified_session_sync(session_sync_state);
  if (verified_sync.status !== OptionStatus.SOME)
    return ANONYMOUS_DEVICE_SESSION;
  return { status: verified_status, verified_sync: verified_sync.value };
}

export function classify_device_session(
  identity_resolution: SessionIdentityResolution,
  session_sync_state: SessionSyncState,
): DeviceSessionState {
  switch (identity_resolution.status) {
    case SESSION_IDENTITY_STATUS.SIGNED_IN:
      return {
        status: DEVICE_SESSION_STATUS.SIGNED_IN,
        identity: identity_resolution.identity,
      };
    case SESSION_IDENTITY_STATUS.UNREACHABLE:
      return classify_signed_out_device(
        DEVICE_SESSION_STATUS.OFFLINE_VERIFIED,
        session_sync_state,
      );
    case SESSION_IDENTITY_STATUS.CONFIRMED_SIGNED_OUT:
      return classify_signed_out_device(
        DEVICE_SESSION_STATUS.SESSION_ENDED,
        session_sync_state,
      );
  }
}
