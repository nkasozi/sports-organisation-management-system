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

import type {
  SavedProfileIdState,
  SavedTokenState,
} from "./authHelperContracts";
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

export interface OfflineVerifiedSessionDependencies {
  verify_saved_token(raw_token: string): Promise<SavedTokenVerificationState>;
  load_saved_profile_id(): Promise<SavedProfileIdState>;
  generate_token_for_profile(profile: UserProfile): Promise<Result<AuthToken>>;
  save_token(raw_token: string): Promise<void>;
}

export interface OfflineVerifiedSessionRequest {
  available_profiles: UserProfile[];
  saved_token_state: SavedTokenState;
}

const OFFLINE_SESSION_EVENT = {
  RESTORED_FROM_TOKEN: "auth_offline_verified_session_restored_from_token",
  RESTORED_FROM_PROFILE: "auth_offline_verified_session_restored_from_profile",
  UNAVAILABLE: "auth_offline_verified_session_unavailable",
} as const;
const OFFLINE_SESSION_UNAVAILABLE_MESSAGE =
  "Your offline profile could not be found on this device.";

function find_verified_user_profile(
  available_profiles: UserProfile[],
  profile_id: string,
): Option<UserProfile> {
  if (profile_id === PUBLIC_VIEWER_PROFILE_ID) return create_none_option();
  const profile = available_profiles.find(
    (candidate) => candidate.id === profile_id,
  );
  return profile ? create_some_option(profile) : create_none_option();
}

async function restore_from_saved_token(
  dependencies: OfflineVerifiedSessionDependencies,
  request: OfflineVerifiedSessionRequest,
): Promise<Option<ResolvedAuthSession>> {
  const { saved_token_state } = request;
  if (saved_token_state.status !== PRESENCE_STATUS.PRESENT)
    return create_none_option();
  const verification = await dependencies.verify_saved_token(
    saved_token_state.raw_token,
  );
  if (verification.status !== SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED)
    return create_none_option();
  const profile = find_verified_user_profile(
    request.available_profiles,
    verification.payload.user_id,
  );
  if (profile.status !== OptionStatus.SOME) return create_none_option();
  return create_some_option({
    profile: profile.value,
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

async function restore_from_saved_profile_id(
  dependencies: OfflineVerifiedSessionDependencies,
  request: OfflineVerifiedSessionRequest,
): Promise<Option<ResolvedAuthSession>> {
  const saved_profile_id = await dependencies.load_saved_profile_id();
  if (saved_profile_id.status !== PRESENCE_STATUS.PRESENT)
    return create_none_option();
  const profile = find_verified_user_profile(
    request.available_profiles,
    saved_profile_id.profile_id,
  );
  if (profile.status !== OptionStatus.SOME) return create_none_option();
  return issue_token_for_profile(dependencies, profile.value);
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

export async function restore_offline_verified_session(
  dependencies: OfflineVerifiedSessionDependencies,
  request: OfflineVerifiedSessionRequest,
): Promise<Result<ResolvedAuthSession>> {
  const from_token = await restore_from_saved_token(dependencies, request);
  if (from_token.status === OptionStatus.SOME)
    return succeed_offline_restore(
      from_token.value,
      OFFLINE_SESSION_EVENT.RESTORED_FROM_TOKEN,
    );
  const from_profile = await restore_from_saved_profile_id(
    dependencies,
    request,
  );
  if (from_profile.status === OptionStatus.SOME)
    return succeed_offline_restore(
      from_profile.value,
      OFFLINE_SESSION_EVENT.RESTORED_FROM_PROFILE,
    );
  console.warn("[AuthStore] No offline profile available for verified data", {
    event: OFFLINE_SESSION_EVENT.UNAVAILABLE,
    available_profile_count: request.available_profiles.length,
  });
  return create_failure_result(OFFLINE_SESSION_UNAVAILABLE_MESSAGE);
}
