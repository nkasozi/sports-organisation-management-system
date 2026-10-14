import type { AuthToken } from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { SavedTokenState } from "./authHelperContracts";
import type { VerifiedIdentityRecord } from "./authOfflineVerifiedIdentity";
import {
  build_restored_auth_token,
  type SavedTokenVerificationState,
} from "./authSavedTokenVerification";
import type { ResolvedAuthSession } from "./authSignedInSessionResolution";
import {
  PUBLIC_VIEWER_PROFILE_ID,
  SAVED_TOKEN_VERIFICATION_STATUS,
} from "./authStoreConstants";
import type { UserProfile } from "./authTypes";
import type { VerifiedSessionSyncState } from "./deviceSessionState";
import { SESSION_SYNC_STATE_STATUS } from "./sessionSyncMarker";

export interface OfflineVerifiedSessionDependencies {
  verify_saved_token(raw_token: string): Promise<SavedTokenVerificationState>;
  load_verified_identity(): Promise<Option<VerifiedIdentityRecord>>;
  generate_token_for_profile(profile: UserProfile): Promise<Result<AuthToken>>;
  save_token(raw_token: string): Promise<void>;
}

export interface OfflineVerifiedSessionRequest {
  available_profiles: UserProfile[];
  saved_token_state: SavedTokenState;
  verified_sync: VerifiedSessionSyncState;
}

const OFFLINE_SESSION_EVENT = {
  RESTORED_FROM_TOKEN: "auth_offline_verified_session_restored_from_token",
  RESTORED_WITH_NEW_TOKEN: "auth_offline_verified_session_token_reissued",
  UNAVAILABLE: "auth_offline_verified_session_unavailable",
} as const;
const OFFLINE_SESSION_UNAVAILABLE_MESSAGE =
  "Your offline profile could not be found on this device.";

function is_identity_bound_to_marker(
  identity: VerifiedIdentityRecord,
  verified_sync: VerifiedSessionSyncState,
): boolean {
  switch (verified_sync.status) {
    case SESSION_SYNC_STATE_STATUS.VERIFIED_USER:
      return identity.clerk_user_id === verified_sync.user_id;
    case SESSION_SYNC_STATE_STATUS.VERIFIED_SESSION:
      return true;
  }
}

function find_verified_profile(
  available_profiles: UserProfile[],
  identity: VerifiedIdentityRecord,
): Option<UserProfile> {
  const verified_email = identity.email.trim().toLowerCase();
  if (verified_email.length === 0) return create_none_option();
  const profile = available_profiles.find(
    (candidate) =>
      candidate.id !== PUBLIC_VIEWER_PROFILE_ID &&
      candidate.email.toLowerCase() === verified_email,
  );
  return profile ? create_some_option(profile) : create_none_option();
}

async function resolve_verified_profile(
  dependencies: OfflineVerifiedSessionDependencies,
  request: OfflineVerifiedSessionRequest,
): Promise<Option<UserProfile>> {
  const identity = await dependencies.load_verified_identity();
  if (identity.status !== OptionStatus.SOME) return create_none_option();
  if (!is_identity_bound_to_marker(identity.value, request.verified_sync))
    return create_none_option();
  return find_verified_profile(request.available_profiles, identity.value);
}

async function reuse_saved_token(
  dependencies: OfflineVerifiedSessionDependencies,
  saved_token_state: SavedTokenState,
  profile: UserProfile,
): Promise<Option<ResolvedAuthSession>> {
  if (saved_token_state.status !== PRESENCE_STATUS.PRESENT)
    return create_none_option();
  const verification = await dependencies.verify_saved_token(
    saved_token_state.raw_token,
  );
  if (verification.status !== SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED)
    return create_none_option();
  if (verification.payload.user_id !== profile.id) return create_none_option();
  return create_some_option({
    profile,
    token: build_restored_auth_token(
      verification.payload,
      saved_token_state.raw_token,
    ),
  });
}

async function issue_token_for_profile(
  dependencies: OfflineVerifiedSessionDependencies,
  profile: UserProfile,
): Promise<Option<ResolvedAuthSession>> {
  const token_result = await dependencies.generate_token_for_profile(profile);
  if (!token_result.success) return create_none_option();
  await dependencies.save_token(token_result.data.raw_token);
  return create_some_option({ profile, token: token_result.data });
}

function succeed_offline_restore(
  session: ResolvedAuthSession,
  event: string,
): Result<ResolvedAuthSession> {
  console.log("[AuthStore] Continuing offline as the last verified user", {
    event,
    profile_id: session.profile.id,
    role: session.profile.role,
  });
  return create_success_result(session);
}

function fail_offline_restore(
  request: OfflineVerifiedSessionRequest,
): Result<ResolvedAuthSession> {
  console.warn("[AuthStore] No offline profile available for verified data", {
    event: OFFLINE_SESSION_EVENT.UNAVAILABLE,
    available_profile_count: request.available_profiles.length,
  });
  return create_failure_result(OFFLINE_SESSION_UNAVAILABLE_MESSAGE);
}

export async function restore_offline_verified_session(
  dependencies: OfflineVerifiedSessionDependencies,
  request: OfflineVerifiedSessionRequest,
): Promise<Result<ResolvedAuthSession>> {
  const profile = await resolve_verified_profile(dependencies, request);
  if (profile.status !== OptionStatus.SOME)
    return fail_offline_restore(request);
  const from_token = await reuse_saved_token(
    dependencies,
    request.saved_token_state,
    profile.value,
  );
  if (from_token.status === OptionStatus.SOME)
    return succeed_offline_restore(
      from_token.value,
      OFFLINE_SESSION_EVENT.RESTORED_FROM_TOKEN,
    );
  const reissued = await issue_token_for_profile(dependencies, profile.value);
  if (reissued.status !== OptionStatus.SOME)
    return fail_offline_restore(request);
  return succeed_offline_restore(
    reissued.value,
    OFFLINE_SESSION_EVENT.RESTORED_WITH_NEW_TOKEN,
  );
}
