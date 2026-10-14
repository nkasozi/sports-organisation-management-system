import type { AsyncResult } from "$lib/core/types/Result";

export interface PendingClerkSignOutDependencies {
  has_pending_clerk_sign_out(): Promise<boolean>;
  suppress_clerk_session(): boolean;
  release_clerk_session_gate(): boolean;
  initialize_clerk(): Promise<boolean>;
  is_clerk_reachable(): boolean;
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

const PENDING_MARKER_STATUS = {
  PENDING: "pending",
  NOT_PENDING: "not_pending",
  UNREADABLE: "unreadable",
} as const;

type PendingMarkerStatus =
  (typeof PENDING_MARKER_STATUS)[keyof typeof PENDING_MARKER_STATUS];

const PENDING_CLERK_SIGN_OUT_EVENT = {
  COMPLETED: "pending_clerk_sign_out_completed",
  STILL_PENDING: "pending_clerk_sign_out_still_pending",
  UNREACHABLE: "pending_clerk_sign_out_clerk_unreachable",
  MARKER_UNREADABLE: "pending_clerk_sign_out_marker_unreadable",
} as const;

async function read_pending_marker_status(
  dependencies: PendingClerkSignOutDependencies,
): Promise<PendingMarkerStatus> {
  try {
    return (await dependencies.has_pending_clerk_sign_out())
      ? PENDING_MARKER_STATUS.PENDING
      : PENDING_MARKER_STATUS.NOT_PENDING;
  } catch (error) {
    console.error("[Logout] Pending sign-out marker could not be read", {
      event: PENDING_CLERK_SIGN_OUT_EVENT.MARKER_UNREADABLE,
      error: String(error),
    });
    return PENDING_MARKER_STATUS.UNREADABLE;
  }
}

async function sign_out_of_reachable_clerk(
  dependencies: PendingClerkSignOutDependencies,
): Promise<PendingClerkSignOutOutcome> {
  await dependencies.initialize_clerk();
  if (!dependencies.is_clerk_reachable()) {
    console.warn("[Logout] Deferred Clerk sign-out waits for a connection", {
      event: PENDING_CLERK_SIGN_OUT_EVENT.UNREACHABLE,
    });
    return PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING;
  }
  const sign_out_result = await dependencies.sign_out();
  if (!sign_out_result.success) {
    console.warn("[Logout] Deferred Clerk sign-out still failing", {
      event: PENDING_CLERK_SIGN_OUT_EVENT.STILL_PENDING,
      error: sign_out_result.error,
    });
    return PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING;
  }
  await dependencies.clear_pending_clerk_sign_out();
  dependencies.release_clerk_session_gate();
  console.log("[Logout] Deferred Clerk sign-out completed", {
    event: PENDING_CLERK_SIGN_OUT_EVENT.COMPLETED,
  });
  return PENDING_CLERK_SIGN_OUT_OUTCOME.COMPLETED;
}

export async function complete_pending_clerk_sign_out(
  dependencies: PendingClerkSignOutDependencies,
): Promise<PendingClerkSignOutOutcome> {
  const marker_status = await read_pending_marker_status(dependencies);
  switch (marker_status) {
    case PENDING_MARKER_STATUS.NOT_PENDING:
      return PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING;
    case PENDING_MARKER_STATUS.UNREADABLE:
      dependencies.suppress_clerk_session();
      return PENDING_CLERK_SIGN_OUT_OUTCOME.STILL_PENDING;
    case PENDING_MARKER_STATUS.PENDING:
      dependencies.suppress_clerk_session();
      return sign_out_of_reachable_clerk(dependencies);
  }
}
