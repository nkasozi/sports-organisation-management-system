import { derived, type Readable, writable } from "svelte/store";

import { OptionStatus } from "$lib/core/types/Option";

import { type ClerkSessionState, INITIAL_CLERK_STATE } from "./clerkAuthTypes";
import {
  apply_clerk_session_gate,
  CLERK_SESSION_GATE_STATUS,
  type ClerkSessionGateStatus,
} from "./clerkSessionGate";
import {
  change_navigation_state,
  type ClerkStoreDelivery,
  type ClerkStoreDeliveryStep,
  deliver_clerk_state,
  LIVE_CLERK_STORE_DELIVERY,
} from "./clerkStoreDelivery";

const clerk_store = writable<ClerkSessionState>(INITIAL_CLERK_STATE);

let clerk_store_delivery: ClerkStoreDelivery = LIVE_CLERK_STORE_DELIVERY;
let clerk_session_gate: ClerkSessionGateStatus = CLERK_SESSION_GATE_STATUS.OPEN;
let latest_clerk_state: ClerkSessionState = INITIAL_CLERK_STATE;

function apply_delivery_step(step: ClerkStoreDeliveryStep): boolean {
  clerk_store_delivery = step.delivery;
  if (step.state_to_publish.status !== OptionStatus.SOME) return false;
  clerk_store.set(step.state_to_publish.value);
  return true;
}

export function publish_clerk_state(new_state: ClerkSessionState): boolean {
  latest_clerk_state = new_state;
  return apply_delivery_step(
    deliver_clerk_state(
      clerk_store_delivery,
      apply_clerk_session_gate(clerk_session_gate, new_state),
    ),
  );
}

export function set_navigating(navigating: boolean): void {
  apply_delivery_step(
    change_navigation_state(clerk_store_delivery, navigating),
  );
}

export function set_clerk_session_gate(
  gate_status: ClerkSessionGateStatus,
): boolean {
  clerk_session_gate = gate_status;
  return publish_clerk_state(latest_clerk_state);
}

export function is_clerk_session_gate_open(): boolean {
  return clerk_session_gate === CLERK_SESSION_GATE_STATUS.OPEN;
}

export function reset_published_clerk_state(): boolean {
  latest_clerk_state = INITIAL_CLERK_STATE;
  clerk_store.set(INITIAL_CLERK_STATE);
  return true;
}

export const clerk_session: Readable<ClerkSessionState> = {
  subscribe: clerk_store.subscribe,
};
export const is_clerk_loaded: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_loaded,
);
export const is_signed_in: Readable<boolean> = derived(
  clerk_store,
  ($state) => $state.is_signed_in,
);
