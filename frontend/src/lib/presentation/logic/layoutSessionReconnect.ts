import {
  CLERK_REACHABILITY_STATUS,
  type ClerkReachability,
} from "$lib/adapters/iam/clerkReachability";

import {
  PENDING_CLERK_SIGN_OUT_OUTCOME,
  type PendingClerkSignOutOutcome,
} from "./pendingClerkSignOutCompletion";

export interface SessionReconnectPorts {
  is_browser_online(): boolean;
  is_clerk_ready(): boolean;
  complete_pending_clerk_sign_out(): Promise<PendingClerkSignOutOutcome>;
  retry_clerk_initialization(): Promise<boolean>;
  is_signed_in(): boolean;
  ensure_signed_in_sync(): boolean;
  check_signed_out_device(): Promise<unknown>;
}

export const SESSION_RECONNECT_OUTCOME = {
  STILL_OFFLINE: "still_offline",
  SIGN_OUT_PENDING: "sign_out_pending",
  SYNC_RESUMED: "sync_resumed",
  SIGNED_OUT_CHECKED: "signed_out_checked",
} as const;

type SessionReconnectOutcome =
  (typeof SESSION_RECONNECT_OUTCOME)[keyof typeof SESSION_RECONNECT_OUTCOME];

const SESSION_RECONNECT_EVENT = "device_session_reconnected";

function log_reconnect_outcome(
  outcome: SessionReconnectOutcome,
): SessionReconnectOutcome {
  console.log("[Layout] Connection returned; session re-checked", {
    event: SESSION_RECONNECT_EVENT,
    outcome,
  });
  return outcome;
}

export function should_retry_clerk_in_background(
  ports: SessionReconnectPorts,
): boolean {
  return ports.is_browser_online() && !ports.is_clerk_ready();
}

export async function reconnect_device_session(
  ports: SessionReconnectPorts,
): Promise<SessionReconnectOutcome> {
  if (!ports.is_browser_online())
    return SESSION_RECONNECT_OUTCOME.STILL_OFFLINE;
  const pending_sign_out = await ports.complete_pending_clerk_sign_out();
  if (pending_sign_out !== PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING)
    return log_reconnect_outcome(SESSION_RECONNECT_OUTCOME.SIGN_OUT_PENDING);
  await ports.retry_clerk_initialization();
  if (ports.is_signed_in()) {
    ports.ensure_signed_in_sync();
    return log_reconnect_outcome(SESSION_RECONNECT_OUTCOME.SYNC_RESUMED);
  }
  await ports.check_signed_out_device();
  return log_reconnect_outcome(SESSION_RECONNECT_OUTCOME.SIGNED_OUT_CHECKED);
}

interface ClerkConfirmationTracker {
  has_just_confirmed(status: ClerkReachability["status"]): boolean;
}

export function create_clerk_confirmation_tracker(
  initial_status: ClerkReachability["status"],
): ClerkConfirmationTracker {
  const tracker_state = {
    was_confirmed: initial_status === CLERK_REACHABILITY_STATUS.CONFIRMED,
  };
  return {
    has_just_confirmed: (status: ClerkReachability["status"]): boolean => {
      const is_confirmed = status === CLERK_REACHABILITY_STATUS.CONFIRMED;
      const just_confirmed = is_confirmed && !tracker_state.was_confirmed;
      tracker_state.was_confirmed = is_confirmed;
      return just_confirmed;
    },
  };
}
