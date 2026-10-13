import type { Clerk } from "@clerk/clerk-js";
import { derived, type Readable, writable } from "svelte/store";

import { browser } from "$app/environment";
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
import { OptionStatus } from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  CLERK_ERROR_CODE,
  CLERK_LOG_EVENT,
  CLERK_MESSAGE,
  type ClerkErrorCode,
} from "./clerkAuthConstants";
import {
  type ClerkSessionState,
  INITIAL_CLERK_STATE,
  LOADED_SIGNED_OUT_CLERK_STATE,
} from "./clerkAuthTypes";
import {
  type ClerkLoadOutcome,
  log_initialization_skipped,
  wait_for_loaded_clerk,
} from "./clerkInstanceLoader";
import {
  CLERK_LIFECYCLE_EVENT,
  CLERK_LIFECYCLE_STATUS,
  type ClerkLifecycleEvent,
  type ClerkLifecycleState,
  INITIAL_CLERK_LIFECYCLE_STATE,
  transition_clerk_lifecycle,
} from "./clerkLifecycleState";
import {
  type ClerkReachability,
  read_browser_network_online,
  resolve_clerk_reachability,
} from "./clerkReachability";
import { build_clerk_session_state } from "./clerkSessionStateBuilders";
import { request_clerk_session_token } from "./clerkSessionToken";
import { sign_out_of_clerk } from "./clerkSignOut";
import {
  change_navigation_state,
  type ClerkStoreDelivery,
  type ClerkStoreDeliveryStep,
  deliver_clerk_state,
  LIVE_CLERK_STORE_DELIVERY,
} from "./clerkStoreDelivery";
export type { ClerkUser } from "./clerkAuthTypes";

const clerk_store = writable<ClerkSessionState>(INITIAL_CLERK_STATE);

let clerk_lifecycle_state: ClerkLifecycleState = INITIAL_CLERK_LIFECYCLE_STATE;
let clerk_store_delivery: ClerkStoreDelivery = LIVE_CLERK_STORE_DELIVERY;

function apply_lifecycle_event(
  event: ClerkLifecycleEvent,
): ClerkLifecycleState {
  clerk_lifecycle_state = transition_clerk_lifecycle(
    clerk_lifecycle_state,
    event,
  );
  return clerk_lifecycle_state;
}

function apply_delivery_step(step: ClerkStoreDeliveryStep): boolean {
  clerk_store_delivery = step.delivery;
  if (step.state_to_publish.status !== OptionStatus.SOME) return false;
  clerk_store.set(step.state_to_publish.value);
  return true;
}

export function set_navigating(navigating: boolean): void {
  apply_delivery_step(
    change_navigation_state(clerk_store_delivery, navigating),
  );
}

function publish_clerk_state_next_frame(new_state: ClerkSessionState): void {
  requestAnimationFrame(() => {
    apply_delivery_step(deliver_clerk_state(clerk_store_delivery, new_state));
  });
}

function sync_clerk_state(): boolean {
  if (clerk_lifecycle_state.status !== CLERK_LIFECYCLE_STATUS.READY)
    return false;
  publish_clerk_state_next_frame(
    build_clerk_session_state(clerk_lifecycle_state.clerk),
  );
  return true;
}

function mark_clerk_unavailable(error_code: ClerkErrorCode): false {
  apply_lifecycle_event({
    type: CLERK_LIFECYCLE_EVENT.CLERK_UNAVAILABLE,
    error_code,
  });
  publish_clerk_state_next_frame(LOADED_SIGNED_OUT_CLERK_STATE);
  return false;
}

function activate_clerk_instance(load_outcome: ClerkLoadOutcome): true {
  const clerk = load_outcome.clerk;
  apply_lifecycle_event({ type: CLERK_LIFECYCLE_EVENT.CLERK_ACTIVATED, clerk });
  clerk_store.set(build_clerk_session_state(clerk));
  clerk.addListener(() => {
    sync_clerk_state();
  });
  console.log("[Clerk] Initialized via ClerkProvider", {
    event: CLERK_LOG_EVENT.INITIALIZED,
    load_status: load_outcome.status,
  });
  return true;
}

async function load_and_activate_clerk(): Promise<boolean> {
  try {
    const clerk_result = await wait_for_loaded_clerk();
    if (!clerk_result.success)
      return mark_clerk_unavailable(CLERK_ERROR_CODE.LOAD_TIMED_OUT);
    return activate_clerk_instance(clerk_result.data);
  } catch (error) {
    console.error("[Clerk] Failed to initialize", {
      event: CLERK_LOG_EVENT.INITIALIZATION_FAILED,
      error_code: CLERK_ERROR_CODE.INITIALIZATION_THREW,
      error: String(error),
    });
    return mark_clerk_unavailable(CLERK_ERROR_CODE.INITIALIZATION_THREW);
  }
}

export async function initialize_clerk(): Promise<boolean> {
  if (!browser)
    return log_initialization_skipped(CLERK_ERROR_CODE.NOT_IN_BROWSER);
  if (!PUBLIC_CLERK_PUBLISHABLE_KEY) {
    log_initialization_skipped(CLERK_ERROR_CODE.PUBLISHABLE_KEY_MISSING);
    return mark_clerk_unavailable(CLERK_ERROR_CODE.PUBLISHABLE_KEY_MISSING);
  }
  const state = apply_lifecycle_event({
    type: CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED,
  });
  if (state.status === CLERK_LIFECYCLE_STATUS.READY) {
    console.log("[Clerk] Already initialized", {
      event: CLERK_LOG_EVENT.ALREADY_INITIALIZED,
    });
    return true;
  }
  return load_and_activate_clerk();
}

export function get_clerk(): Result<Clerk> {
  if (clerk_lifecycle_state.status !== CLERK_LIFECYCLE_STATUS.READY)
    return create_failure_result(CLERK_MESSAGE.NOT_INITIALIZED);
  return create_success_result(clerk_lifecycle_state.clerk);
}

export function get_clerk_reachability(): ClerkReachability {
  return resolve_clerk_reachability(
    clerk_lifecycle_state,
    read_browser_network_online(),
  );
}

export async function get_session_token(): Promise<Result<string>> {
  return request_clerk_session_token(get_clerk());
}

export async function sign_out(): Promise<Result<true>> {
  const clerk_result = get_clerk();
  if (!clerk_result.success) {
    console.error("[Clerk] Sign out requested before initialization", {
      event: CLERK_LOG_EVENT.SIGN_OUT_REJECTED,
    });
    return clerk_result;
  }
  return sign_out_of_clerk(clerk_result.data, sync_clerk_state);
}

export function destroy_clerk(): void {
  apply_lifecycle_event({ type: CLERK_LIFECYCLE_EVENT.DESTROYED });
  clerk_store.set(INITIAL_CLERK_STATE);
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
