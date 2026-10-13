import type { Clerk } from "@clerk/clerk-js";

import type { ClerkErrorCode } from "./clerkAuthConstants";

export const CLERK_LIFECYCLE_STATUS = {
  UNINITIALIZED: "uninitialized",
  INITIALIZING: "initializing",
  READY: "ready",
  UNAVAILABLE: "unavailable",
} as const;

export type ClerkLifecycleState =
  | { status: typeof CLERK_LIFECYCLE_STATUS.UNINITIALIZED }
  | { status: typeof CLERK_LIFECYCLE_STATUS.INITIALIZING }
  | { status: typeof CLERK_LIFECYCLE_STATUS.READY; clerk: Clerk }
  | {
      status: typeof CLERK_LIFECYCLE_STATUS.UNAVAILABLE;
      error_code: ClerkErrorCode;
    };

export const CLERK_LIFECYCLE_EVENT = {
  INITIALIZATION_STARTED: "initialization_started",
  CLERK_ACTIVATED: "clerk_activated",
  CLERK_UNAVAILABLE: "clerk_unavailable",
  DESTROYED: "destroyed",
} as const;

export type ClerkLifecycleEvent =
  | { type: typeof CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED }
  | { type: typeof CLERK_LIFECYCLE_EVENT.CLERK_ACTIVATED; clerk: Clerk }
  | {
      type: typeof CLERK_LIFECYCLE_EVENT.CLERK_UNAVAILABLE;
      error_code: ClerkErrorCode;
    }
  | { type: typeof CLERK_LIFECYCLE_EVENT.DESTROYED };

export const INITIAL_CLERK_LIFECYCLE_STATE: ClerkLifecycleState = {
  status: CLERK_LIFECYCLE_STATUS.UNINITIALIZED,
};

function start_initialization(state: ClerkLifecycleState): ClerkLifecycleState {
  switch (state.status) {
    case CLERK_LIFECYCLE_STATUS.READY:
      return state;
    case CLERK_LIFECYCLE_STATUS.UNINITIALIZED:
    case CLERK_LIFECYCLE_STATUS.INITIALIZING:
    case CLERK_LIFECYCLE_STATUS.UNAVAILABLE:
      return { status: CLERK_LIFECYCLE_STATUS.INITIALIZING };
  }
}

export function transition_clerk_lifecycle(
  state: ClerkLifecycleState,
  event: ClerkLifecycleEvent,
): ClerkLifecycleState {
  switch (event.type) {
    case CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED:
      return start_initialization(state);
    case CLERK_LIFECYCLE_EVENT.CLERK_ACTIVATED:
      return { status: CLERK_LIFECYCLE_STATUS.READY, clerk: event.clerk };
    case CLERK_LIFECYCLE_EVENT.CLERK_UNAVAILABLE:
      return {
        status: CLERK_LIFECYCLE_STATUS.UNAVAILABLE,
        error_code: event.error_code,
      };
    case CLERK_LIFECYCLE_EVENT.DESTROYED:
      return INITIAL_CLERK_LIFECYCLE_STATE;
  }
}
