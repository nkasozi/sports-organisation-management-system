import type { AuthToken } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { clear_auth_storage } from "./authHelpers";
import {
  type ClerkEmailState,
  find_profile_by_id,
  type RestoredSignedInSessionState,
} from "./authInitializationContracts";
import {
  build_restored_auth_token,
  verify_saved_token,
} from "./authSavedTokenVerification";
import {
  AUTH_STORE_LOG_EVENTS,
  PROFILE_MATCH_STATUS,
  SAVED_TOKEN_VERIFICATION_STATUS,
  SESSION_RESTORE_STATUS,
} from "./authStoreConstants";
import type { UserProfile } from "./authTypes";

type TokenProfileState = ReturnType<typeof find_profile_by_id>;

function is_token_profile_matching_clerk_user(
  token_profile_state: TokenProfileState,
  clerk_email_state: ClerkEmailState,
): boolean {
  if (clerk_email_state.status !== PRESENCE_STATUS.PRESENT) return false;
  return (
    token_profile_state.status === PROFILE_MATCH_STATUS.FOUND &&
    token_profile_state.profile.email.toLowerCase() === clerk_email_state.email
  );
}

function warn_stale_token_owner_mismatch(
  token_profile_state: TokenProfileState,
  clerk_email_state: ClerkEmailState,
): boolean {
  console.warn("[AuthStore] Saved token belongs to a different user", {
    event: AUTH_STORE_LOG_EVENTS.SAVED_TOKEN_OWNER_MISMATCH,
    token_profile_status: token_profile_state.status,
    clerk_email_status: clerk_email_state.status,
  });
  return true;
}

async function restore_verified_signed_in_session(
  available_profiles: UserProfile[],
  verified_payload: AuthToken["payload"],
  saved_token_raw: string,
  clerk_email_state: ClerkEmailState,
): Promise<RestoredSignedInSessionState> {
  const token_profile_state = find_profile_by_id(
    available_profiles,
    verified_payload.user_id,
  );

  if (
    token_profile_state.status !== PROFILE_MATCH_STATUS.FOUND ||
    !is_token_profile_matching_clerk_user(
      token_profile_state,
      clerk_email_state,
    )
  ) {
    warn_stale_token_owner_mismatch(token_profile_state, clerk_email_state);
    await clear_auth_storage();
    return { status: SESSION_RESTORE_STATUS.NOT_RESTORED };
  }

  console.log("[AuthStore] Restored signed-in session", {
    event: AUTH_STORE_LOG_EVENTS.SIGNED_IN_SESSION_RESTORED,
    profile_id: token_profile_state.profile.id,
  });
  return {
    status: SESSION_RESTORE_STATUS.RESTORED,
    profile: token_profile_state.profile,
    token: build_restored_auth_token(verified_payload, saved_token_raw),
  };
}

export async function try_restore_signed_in_session(
  available_profiles: UserProfile[],
  saved_token_raw: string,
  clerk_email_state: ClerkEmailState,
): Promise<RestoredSignedInSessionState> {
  const verification_state = await verify_saved_token(saved_token_raw);
  if (verification_state.status !== SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED) {
    console.warn("[AuthStore] Saved token is invalid or expired", {
      event: AUTH_STORE_LOG_EVENTS.SAVED_TOKEN_REJECTED,
      verification_status: verification_state.status,
    });
    await clear_auth_storage();
    return { status: SESSION_RESTORE_STATUS.NOT_RESTORED };
  }

  return restore_verified_signed_in_session(
    available_profiles,
    verification_state.payload,
    saved_token_raw,
    clerk_email_state,
  );
}
