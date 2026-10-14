import { type Readable, writable } from "svelte/store";

import {
  type ClerkSessionState,
  LOADED_SIGNED_OUT_CLERK_STATE,
} from "./clerkAuthTypes";

export const CLERK_SESSION_GATE_STATUS = {
  OPEN: "open",
  SUPPRESSED_UNTIL_SIGNED_OUT: "suppressed_until_signed_out",
} as const;

export type ClerkSessionGateStatus =
  (typeof CLERK_SESSION_GATE_STATUS)[keyof typeof CLERK_SESSION_GATE_STATUS];

export function apply_clerk_session_gate(
  gate_status: ClerkSessionGateStatus,
  clerk_state: ClerkSessionState,
): ClerkSessionState {
  switch (gate_status) {
    case CLERK_SESSION_GATE_STATUS.OPEN:
      return clerk_state;
    case CLERK_SESSION_GATE_STATUS.SUPPRESSED_UNTIL_SIGNED_OUT:
      return LOADED_SIGNED_OUT_CLERK_STATE;
  }
}

const provider_generation_store = writable<number>(0);

export const clerk_provider_generation: Readable<number> = {
  subscribe: provider_generation_store.subscribe,
};

export function request_clerk_provider_reload(): boolean {
  provider_generation_store.update((generation) => generation + 1);
  return true;
}
