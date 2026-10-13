import type { Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";

import type { AuthState, UserProfile } from "./authTypes";

export const PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY = {
  CLEAR_SAVED_CREDENTIALS: "clear_saved_credentials",
  KEEP_SAVED_CREDENTIALS: "keep_saved_credentials",
} as const;

type PublicViewerLockCredentialPolicy =
  (typeof PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY)[keyof typeof PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY];

const STALE_VERIFIED_SESSION_LOCKED_EVENT =
  "auth_stale_verified_session_locked";
const NO_LOCAL_PROFILES: UserProfile[] = [];

export interface PublicViewerOnlySessionDependencies {
  clear_auth_storage(): Promise<unknown>;
  build_profiles_with_public_viewer(profiles: UserProfile[]): UserProfile[];
  create_default_anonymous_state(profiles: UserProfile[]): Promise<AuthState>;
}

async function apply_credential_policy(
  dependencies: PublicViewerOnlySessionDependencies,
  credential_policy: PublicViewerLockCredentialPolicy,
): Promise<boolean> {
  switch (credential_policy) {
    case PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY.CLEAR_SAVED_CREDENTIALS:
      await dependencies.clear_auth_storage();
      return true;
    case PUBLIC_VIEWER_LOCK_CREDENTIAL_POLICY.KEEP_SAVED_CREDENTIALS:
      return false;
  }
}

export async function initialize_public_viewer_only_session(
  dependencies: PublicViewerOnlySessionDependencies,
  state_setter: (state: AuthState) => void,
  credential_policy: PublicViewerLockCredentialPolicy,
): Promise<Result<true>> {
  console.warn("[AuthStore] Signed-in data found without a usable session", {
    event: STALE_VERIFIED_SESSION_LOCKED_EVENT,
    credential_policy,
  });
  await apply_credential_policy(dependencies, credential_policy);
  const public_viewer_only_profiles =
    dependencies.build_profiles_with_public_viewer(NO_LOCAL_PROFILES);
  state_setter(
    await dependencies.create_default_anonymous_state(
      public_viewer_only_profiles,
    ),
  );
  return create_success_result(true);
}
