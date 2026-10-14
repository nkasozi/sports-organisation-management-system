import type { Clerk } from "@clerk/clerk-js";

import {
  CLERK_LIFECYCLE_STATUS,
  type ClerkLifecycleState,
} from "./clerkLifecycleState";

export const CLERK_REACHABILITY_STATUS = {
  CONFIRMED: "confirmed",
  UNREACHABLE: "unreachable",
  PENDING: "pending",
} as const;

export type ClerkReachability =
  | { status: typeof CLERK_REACHABILITY_STATUS.CONFIRMED }
  | { status: typeof CLERK_REACHABILITY_STATUS.UNREACHABLE }
  | { status: typeof CLERK_REACHABILITY_STATUS.PENDING };

const CLERK_READY_STATUS = "ready";
const BROWSER_GLOBAL_TYPE_UNDEFINED = "undefined";

const CONFIRMED_REACHABILITY: ClerkReachability = {
  status: CLERK_REACHABILITY_STATUS.CONFIRMED,
};
const UNREACHABLE_REACHABILITY: ClerkReachability = {
  status: CLERK_REACHABILITY_STATUS.UNREACHABLE,
};
const PENDING_REACHABILITY: ClerkReachability = {
  status: CLERK_REACHABILITY_STATUS.PENDING,
};

function is_clerk_instance_answering(
  clerk: Clerk,
  network_online: boolean,
): boolean {
  return network_online && clerk.loaded && clerk.status === CLERK_READY_STATUS;
}

export function resolve_clerk_reachability(
  lifecycle_state: ClerkLifecycleState,
  network_online: boolean,
): ClerkReachability {
  switch (lifecycle_state.status) {
    case CLERK_LIFECYCLE_STATUS.READY:
      return is_clerk_instance_answering(lifecycle_state.clerk, network_online)
        ? CONFIRMED_REACHABILITY
        : UNREACHABLE_REACHABILITY;
    case CLERK_LIFECYCLE_STATUS.UNINITIALIZED:
    case CLERK_LIFECYCLE_STATUS.INITIALIZING:
      return PENDING_REACHABILITY;
    case CLERK_LIFECYCLE_STATUS.UNAVAILABLE:
      return UNREACHABLE_REACHABILITY;
  }
}

export function read_browser_network_online(): boolean {
  if (typeof navigator === BROWSER_GLOBAL_TYPE_UNDEFINED) return false;
  return navigator.onLine;
}

export function is_browser_known_offline(): boolean {
  if (typeof navigator === BROWSER_GLOBAL_TYPE_UNDEFINED) return false;
  return navigator.onLine === false;
}
