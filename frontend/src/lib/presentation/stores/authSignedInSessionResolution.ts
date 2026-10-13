import type { AuthToken } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { SavedTokenState } from "./authHelperContracts";
import {
  generate_token_for_profile,
  save_profile_id,
  save_token,
} from "./authHelpers";
import {
  type ClerkEmailState,
  find_profile_by_email,
} from "./authInitializationContracts";
import {
  get_clerk_email,
  try_restore_signed_in_session,
} from "./authInitializationHelpers";
import {
  AUTH_STORE_LOG_EVENTS,
  AUTH_STORE_MESSAGES,
  PROFILE_MATCH_STATUS,
  SESSION_RESTORE_STATUS,
} from "./authStoreConstants";
import type { UserProfile } from "./authTypes";

export type ResolvedAuthSession = { profile: UserProfile; token: AuthToken };

function log_missing_clerk_local_profile(
  clerk_email_state: ClerkEmailState,
): boolean {
  console.error("[AuthStore] Cannot initialize", {
    event: AUTH_STORE_LOG_EVENTS.LOCAL_PROFILE_NOT_FOUND,
    clerk_email_status: clerk_email_state.status,
  });
  return true;
}

async function resolve_session_from_clerk_email(
  available_profiles: UserProfile[],
  clerk_email_state: ClerkEmailState,
): Promise<Result<ResolvedAuthSession>> {
  const clerk_local_profile_state =
    clerk_email_state.status === PRESENCE_STATUS.PRESENT
      ? find_profile_by_email(
          available_profiles,
          clerk_email_state.email.toLowerCase(),
        )
      : { status: PROFILE_MATCH_STATUS.MISSING };

  if (clerk_local_profile_state.status !== PROFILE_MATCH_STATUS.FOUND) {
    log_missing_clerk_local_profile(clerk_email_state);
    return create_failure_result(
      AUTH_STORE_MESSAGES.SIGNED_IN_PROFILE_NOT_FOUND,
    );
  }

  return create_session_for_clerk_local_profile(
    clerk_local_profile_state.profile,
  );
}

async function create_session_for_clerk_local_profile(
  clerk_local_profile: UserProfile,
): Promise<Result<ResolvedAuthSession>> {
  const token_result = await generate_token_for_profile(clerk_local_profile);
  if (!token_result.success) {
    console.error("[AuthStore] Failed to generate token", {
      event: AUTH_STORE_LOG_EVENTS.TOKEN_GENERATION_FAILED,
      error: token_result.error,
    });
    return create_failure_result(token_result.error);
  }
  await save_token(token_result.data.raw_token);
  await save_profile_id(clerk_local_profile.id);
  console.log("[AuthStore] Initialized profile via Clerk email match", {
    event: AUTH_STORE_LOG_EVENTS.INITIALIZED_FROM_CLERK_EMAIL,
    profile_id: clerk_local_profile.id,
    role: clerk_local_profile.role,
  });
  return create_success_result({
    profile: clerk_local_profile,
    token: token_result.data,
  });
}

export async function resolve_signed_in_session(
  available_profiles: UserProfile[],
  saved_token_state: SavedTokenState,
): Promise<Result<ResolvedAuthSession>> {
  const clerk_email_state = get_clerk_email();
  const restored =
    saved_token_state.status === PRESENCE_STATUS.PRESENT
      ? await try_restore_signed_in_session(
          available_profiles,
          saved_token_state.raw_token,
          clerk_email_state,
        )
      : { status: SESSION_RESTORE_STATUS.NOT_RESTORED };

  if (restored.status === SESSION_RESTORE_STATUS.RESTORED) {
    return create_success_result({
      profile: restored.profile,
      token: restored.token,
    });
  }

  return resolve_session_from_clerk_email(
    available_profiles,
    clerk_email_state,
  );
}
