import {
  CLERK_PRESENCE_STATUS,
  type ClerkSessionState,
} from "$lib/adapters/iam/clerkAuthTypes";

export const ACTIVE_CLERK_IDENTITY_STATUS = {
  SIGNED_OUT: "signed_out",
  SIGNED_IN: "signed_in",
  SIGNED_IN_USER_UNRESOLVED: "signed_in_user_unresolved",
} as const;

const IDENTITY_STATUS = ACTIVE_CLERK_IDENTITY_STATUS;

export type ActiveClerkIdentityState =
  | { status: typeof IDENTITY_STATUS.SIGNED_OUT }
  | {
      status: typeof IDENTITY_STATUS.SIGNED_IN;
      session_id: string;
      user_id: string;
    }
  | {
      status: typeof IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED;
      session_id: string;
    };

export function build_active_clerk_identity_state(
  clerk_state: ClerkSessionState,
): ActiveClerkIdentityState {
  const { session_id_state, user_state } = clerk_state;
  if (session_id_state.status !== CLERK_PRESENCE_STATUS.PRESENT)
    return { status: IDENTITY_STATUS.SIGNED_OUT };
  if (
    user_state.status !== CLERK_PRESENCE_STATUS.PRESENT ||
    user_state.user.id.length === 0
  )
    return {
      status: IDENTITY_STATUS.SIGNED_IN_USER_UNRESOLVED,
      session_id: session_id_state.session_id,
    };
  return {
    status: IDENTITY_STATUS.SIGNED_IN,
    session_id: session_id_state.session_id,
    user_id: user_state.user.id,
  };
}
