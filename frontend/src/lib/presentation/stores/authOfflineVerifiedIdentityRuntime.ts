import { get } from "svelte/store";

import { clerk_session } from "$lib/adapters/iam/clerkAuthService";

import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  build_active_clerk_identity_state,
} from "./activeClerkIdentity";
import { remember_verified_identity } from "./authOfflineVerifiedIdentity";
import type { UserProfile } from "./authTypes";

export async function remember_verified_identity_for_profile(
  profile: UserProfile,
): Promise<boolean> {
  const identity = build_active_clerk_identity_state(get(clerk_session));
  if (identity.status !== ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN) return false;
  return remember_verified_identity({
    clerk_user_id: identity.user_id,
    email: profile.email,
  });
}
