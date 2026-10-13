import {
  PENDING_CLERK_SIGN_OUT_OUTCOME,
  type PendingClerkSignOutOutcome,
} from "./pendingClerkSignOutCompletion";

interface SignedInTransitionDependencies {
  complete_pending_clerk_sign_out(): Promise<PendingClerkSignOutOutcome>;
  has_session_been_synced(): Promise<boolean>;
  resume_verified_session(): Promise<unknown>;
  run_login_sync(): Promise<unknown>;
}

export const SIGNED_IN_TRANSITION_OUTCOME = {
  RESUMED: "resumed",
  LOGIN_SYNC_STARTED: "login_sync_started",
  DEFERRED_SIGN_OUT_FINISHED: "deferred_sign_out_finished",
} as const;

type SignedInTransitionOutcome =
  (typeof SIGNED_IN_TRANSITION_OUTCOME)[keyof typeof SIGNED_IN_TRANSITION_OUTCOME];

const SIGNED_IN_TRANSITION_EVENT = "user_signed_in_transition_handled";

export async function handle_user_signed_in_transition(
  dependencies: SignedInTransitionDependencies,
): Promise<SignedInTransitionOutcome> {
  const pending_sign_out = await dependencies.complete_pending_clerk_sign_out();
  if (pending_sign_out !== PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING)
    return SIGNED_IN_TRANSITION_OUTCOME.DEFERRED_SIGN_OUT_FINISHED;
  const session_already_synced = await dependencies.has_session_been_synced();
  const outcome = session_already_synced
    ? SIGNED_IN_TRANSITION_OUTCOME.RESUMED
    : SIGNED_IN_TRANSITION_OUTCOME.LOGIN_SYNC_STARTED;
  console.log("[Layout] Signed-in transition handled", {
    event: SIGNED_IN_TRANSITION_EVENT,
    outcome,
  });
  if (session_already_synced) {
    await dependencies.resume_verified_session();
    return outcome;
  }
  await dependencies.run_login_sync();
  return outcome;
}
