import type { ClerkSessionCookieIdentity } from "$lib/adapters/iam/clerkSessionCookieIdentity";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import type { VerifiedIdentityRecord } from "$lib/presentation/stores/authOfflineVerifiedIdentity";

const SAVED_IDENTITY_EVENTS = {
  MATCHED: "auth_checker_saved_identity_matched",
  NOT_MATCHED: "auth_checker_saved_identity_not_matched",
  LOAD_FAILED: "auth_checker_saved_identity_load_failed",
} as const;

interface SavedIdentityDependencies {
  clerk_session_id: Option<string>;
  read_cookie_identity(): Option<ClerkSessionCookieIdentity>;
  load_verified_identity(): Promise<Option<VerifiedIdentityRecord>>;
}

async function load_saved_identity(
  dependencies: SavedIdentityDependencies,
): Promise<Option<VerifiedIdentityRecord>> {
  try {
    return await dependencies.load_verified_identity();
  } catch (error) {
    console.error("[AuthChecker] Saved identity could not be read", {
      event: SAVED_IDENTITY_EVENTS.LOAD_FAILED,
      error: String(error),
    });
    return { status: OptionStatus.NONE };
  }
}

export async function has_saved_identity_for_session(
  dependencies: SavedIdentityDependencies,
): Promise<boolean> {
  const cookie_identity = dependencies.read_cookie_identity();
  const saved_identity = await load_saved_identity(dependencies);
  const is_match =
    dependencies.clerk_session_id.status === OptionStatus.SOME &&
    cookie_identity.status === OptionStatus.SOME &&
    saved_identity.status === OptionStatus.SOME &&
    cookie_identity.value.session_id === dependencies.clerk_session_id.value &&
    cookie_identity.value.user_id === saved_identity.value.clerk_user_id;
  console.log("[AuthChecker] Checked saved identity for this session", {
    event: is_match
      ? SAVED_IDENTITY_EVENTS.MATCHED
      : SAVED_IDENTITY_EVENTS.NOT_MATCHED,
  });
  return is_match;
}
