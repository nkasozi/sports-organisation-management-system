import type { AuthToken } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  PROFILE_MATCH_STATUS,
  SESSION_RESTORE_STATUS,
} from "./authStoreConstants";
import type { AuthState, UserProfile } from "./authTypes";

type MatchedUserProfileState =
  | { status: typeof PROFILE_MATCH_STATUS.FOUND; profile: UserProfile }
  | { status: typeof PROFILE_MATCH_STATUS.MISSING };

export type RestoredAnonymousSessionState =
  | { status: typeof SESSION_RESTORE_STATUS.RESTORED; auth_state: AuthState }
  | { status: typeof SESSION_RESTORE_STATUS.NOT_RESTORED };

export type RestoredSignedInSessionState =
  | {
      status: typeof SESSION_RESTORE_STATUS.RESTORED;
      profile: UserProfile;
      token: AuthToken;
    }
  | { status: typeof SESSION_RESTORE_STATUS.NOT_RESTORED };

export type ClerkEmailState =
  | { status: typeof PRESENCE_STATUS.PRESENT; email: string }
  | { status: typeof PRESENCE_STATUS.MISSING };

export function find_profile_by_id(
  available_profiles: UserProfile[],
  profile_id: string,
): MatchedUserProfileState {
  const matched_profile = available_profiles.find(
    (profile) => profile.id === profile_id,
  );

  if (!matched_profile) {
    return { status: PROFILE_MATCH_STATUS.MISSING };
  }

  return {
    status: PROFILE_MATCH_STATUS.FOUND,
    profile: matched_profile,
  };
}

export function find_profile_by_email(
  available_profiles: UserProfile[],
  email: string,
): MatchedUserProfileState {
  const matched_profile = available_profiles.find(
    (profile) => profile.email.toLowerCase() === email,
  );

  if (!matched_profile) {
    return { status: PROFILE_MATCH_STATUS.MISSING };
  }

  return {
    status: PROFILE_MATCH_STATUS.FOUND,
    profile: matched_profile,
  };
}
