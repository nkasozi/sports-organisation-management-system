import type { ClerkSessionState } from "$lib/adapters/iam/clerkAuthTypes";
import {
  CLERK_REACHABILITY_STATUS,
  type ClerkReachability,
} from "$lib/adapters/iam/clerkReachability";

import {
  ACTIVE_CLERK_IDENTITY_STATUS,
  type ActiveClerkIdentityState,
  build_active_clerk_identity_state,
} from "./activeClerkIdentity";

export const SESSION_IDENTITY_STATUS = {
  SIGNED_IN: "signed_in",
  CONFIRMED_SIGNED_OUT: "confirmed_signed_out",
  UNREACHABLE: "unreachable",
} as const;

export type SignedInClerkIdentity = Exclude<
  ActiveClerkIdentityState,
  { status: typeof ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT }
>;

export type SessionIdentityResolution =
  | {
      status: typeof SESSION_IDENTITY_STATUS.SIGNED_IN;
      identity: SignedInClerkIdentity;
    }
  | { status: typeof SESSION_IDENTITY_STATUS.CONFIRMED_SIGNED_OUT }
  | { status: typeof SESSION_IDENTITY_STATUS.UNREACHABLE };

function resolve_signed_out_identity(
  reachability: ClerkReachability,
): SessionIdentityResolution {
  switch (reachability.status) {
    case CLERK_REACHABILITY_STATUS.CONFIRMED:
      return { status: SESSION_IDENTITY_STATUS.CONFIRMED_SIGNED_OUT };
    case CLERK_REACHABILITY_STATUS.UNREACHABLE:
    case CLERK_REACHABILITY_STATUS.PENDING:
      return { status: SESSION_IDENTITY_STATUS.UNREACHABLE };
  }
}

export function resolve_session_identity(
  reachability: ClerkReachability,
  clerk_state: ClerkSessionState,
): SessionIdentityResolution {
  const identity = build_active_clerk_identity_state(clerk_state);
  switch (identity.status) {
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN:
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED:
      return { status: SESSION_IDENTITY_STATUS.SIGNED_IN, identity };
    case ACTIVE_CLERK_IDENTITY_STATUS.SIGNED_OUT:
      return resolve_signed_out_identity(reachability);
  }
}
