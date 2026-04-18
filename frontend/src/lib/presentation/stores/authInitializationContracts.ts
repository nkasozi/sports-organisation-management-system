import type { AuthToken } from "$lib/core/interfaces/ports";

import type { AuthState, UserProfile } from "./authTypes";

type MatchedUserProfileState =
  | { status: "found"; profile: UserProfile }
  | { status: "missing" };

export type RestoredAnonymousSessionState =
  | { status: "restored"; auth_state: AuthState }
  | { status: "not_restored" };

export type RestoredSignedInSessionState =
  | { status: "restored"; profile: UserProfile; token: AuthToken }
  | { status: "not_restored" };

export type ClerkEmailState =
  | { status: "present"; email: string }
  | { status: "missing" };

export function find_profile_by_id(
  available_profiles: UserProfile[],
  profile_id: string,
): MatchedUserProfileState {
  const matched_profile = available_profiles.find(
    (profile) => profile.id === profile_id,
  );

  if (!matched_profile) {
    return { status: "missing" };
  }

  return {
    status: "found",
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
    return { status: "missing" };
  }

  return {
    status: "found",
    profile: matched_profile,
  };
}
