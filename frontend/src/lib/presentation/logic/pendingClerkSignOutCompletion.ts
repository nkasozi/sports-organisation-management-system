import type { AsyncResult } from "$lib/core/types/Result";

export interface PendingClerkSignOutDependencies {
  has_pending_clerk_sign_out(): Promise<boolean>;
  sign_out(): AsyncResult<true>;
  clear_pending_clerk_sign_out(): Promise<boolean>;
}

export const PENDING_CLERK_SIGN_OUT_OUTCOME = {
  NONE_PENDING: "none_pending",
  COMPLETED: "completed",
  STILL_PENDING: "still_pending",
} as const;

export type PendingClerkSignOutOutcome =
  (typeof PENDING_CLERK_SIGN_OUT_OUTCOME)[keyof typeof PENDING_CLERK_SIGN_OUT_OUTCOME];

const PENDING_CLERK_SIGN_OUT_EVENT = {
  COMPLETED: "pending_clerk_sign_out_completed",
  STILL_PENDING: "pending_clerk_sign_out_still_pending",
} as const;

export async function complete_pending_clerk_sign_out(
  dependencies: PendingClerkSignOutDependencies,
): Promise<PendingClerkSignOutOutcome> {
  if (!(await dependencies.has_pending_clerk_sign_out()))
    return PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING;
  const sign_out_result = await dependencies.sign_out();
  if (!sign_out_result.success) {
    console.warn("[Logout] Deferred Clerk sign-out still failing", {
      event: PENDING_CLERK_SIGN_OUT_EVENT.STILL_PENDING,
      error: sign_out_result.error,
    });
    return PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING;
  }
  await dependencies.clear_pending_clerk_sign_out();
  console.log("[Logout] Deferred Clerk sign-out completed", {
    event: PENDING_CLERK_SIGN_OUT_EVENT.COMPLETED,
  });
  return PENDING_CLERK_SIGN_OUT_OUTCOME.COMPLETED;
}
