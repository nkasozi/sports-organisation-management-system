import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  type ActiveClerkIdentityState,
} from "$lib/presentation/stores/activeClerkIdentity";
import {
  SESSION_SYNC_STATE_STATUS,
  type SessionSyncState,
} from "$lib/presentation/stores/sessionSyncMarker";

export interface LoginPendingChangeOwnerDependencies {
  read_session_sync_state(): Promise<SessionSyncState>;
  get_active_clerk_identity(): ActiveClerkIdentityState;
  start_background_sync(): void;
  flush_pending_changes(): AsyncResult<{ skipped_offline: boolean }>;
  get_unsynced_local_change_count(): AsyncResult<number>;
}

export const PENDING_CHANGE_OWNER = {
  SAME_VERIFIED_USER: "same_verified_user",
  ANONYMOUS_DEMO: "anonymous_demo",
  OTHER_ACCOUNT: "other_account",
} as const;

type PendingChangeOwner =
  (typeof PENDING_CHANGE_OWNER)[keyof typeof PENDING_CHANGE_OWNER];

const LOGIN_PENDING_CHANGE_EVENT = {
  PUSH_STARTED: "login_same_user_changes_push_started",
  PUSH_FAILED: "login_same_user_changes_push_failed",
} as const;

function is_same_signed_in_user(
  marker_user_id: string,
  identity: ActiveClerkIdentityState,
): boolean {
  switch (identity.status) {
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN:
      return identity.user_id === marker_user_id;
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED:
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT:
      return false;
  }
}

export function classify_pending_change_owner(
  session_sync_state: SessionSyncState,
  identity: ActiveClerkIdentityState,
): PendingChangeOwner {
  switch (session_sync_state.status) {
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
      return is_same_signed_in_user(session_sync_state.user_id, identity)
        ? PENDING_CHANGE_OWNER.SAME_VERIFIED_USER
        : PENDING_CHANGE_OWNER.OTHER_ACCOUNT;
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
    case SESSION_SYNC_STATE_STATUS.LEGACY:
      return PENDING_CHANGE_OWNER.OTHER_ACCOUNT;
    case SESSION_SYNC_STATE_STATUS.ANONYMOUS:
    case SESSION_SYNC_STATE_STATUS.MISSING:
      return PENDING_CHANGE_OWNER.ANONYMOUS_DEMO;
  }
}

export async function push_same_user_changes_before_login(
  dependencies: LoginPendingChangeOwnerDependencies,
  unsynced_count: number,
): Promise<Result<number>> {
  console.log("[Layout] Pushing your unsynced changes before sign-in sync", {
    event: LOGIN_PENDING_CHANGE_EVENT.PUSH_STARTED,
    unsynced_count,
  });
  dependencies.start_background_sync();
  const flush_result = await dependencies.flush_pending_changes();
  if (!flush_result.success)
    console.warn("[Layout] Some unsynced changes could not be pushed", {
      event: LOGIN_PENDING_CHANGE_EVENT.PUSH_FAILED,
      error: flush_result.error,
    });
  return dependencies.get_unsynced_local_change_count();
}
