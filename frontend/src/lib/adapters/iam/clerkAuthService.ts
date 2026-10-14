import type { Clerk } from "@clerk/clerk-js";

import { browser } from "$app/environment";
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type ClerkActivationPort,
  load_and_activate_clerk,
  mark_clerk_lifecycle_unavailable,
} from "./clerkActivation";
import {
  CLERK_ERROR_CODE,
  CLERK_LOG_EVENT,
  CLERK_MESSAGE,
  type ClerkErrorCode,
} from "./clerkAuthConstants";
import { log_initialization_skipped } from "./clerkInstanceLoader";
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
  is_browser_known_offline,
  read_browser_network_online,
  resolve_clerk_reachability,
} from "./clerkReachability";
import { expire_clerk_session_cookies } from "./clerkSessionCookie";
import {
  CLERK_SESSION_GATE_STATUS,
  request_clerk_provider_reload,
} from "./clerkSessionGate";
import {
  is_clerk_session_gate_open,
  publish_clerk_state,
  reset_published_clerk_state,
  set_clerk_session_gate,
} from "./clerkSessionPublisher";
import { build_clerk_session_state } from "./clerkSessionStateBuilders";
import { request_clerk_session_token } from "./clerkSessionToken";
import { sign_out_of_clerk } from "./clerkSignOut";
export type { ClerkUser } from "./clerkAuthTypes";
export { clerk_provider_generation } from "./clerkSessionGate";

let clerk_lifecycle_state: ClerkLifecycleState = INITIAL_CLERK_LIFECYCLE_STATE;
let initialization_in_flight: Option<Promise<boolean>> = create_none_option();

function apply_lifecycle_event(
  event: ClerkLifecycleEvent,
): ClerkLifecycleState {
  clerk_lifecycle_state = transition_clerk_lifecycle(
    clerk_lifecycle_state,
    event,
  );
  return clerk_lifecycle_state;
}

function sync_clerk_state(): boolean {
  if (clerk_lifecycle_state.status !== CLERK_LIFECYCLE_STATUS.READY)
    return false;
  return publish_clerk_state(
    build_clerk_session_state(clerk_lifecycle_state.clerk),
  );
}

const activation_port: ClerkActivationPort = {
  apply_lifecycle_event,
  sync_clerk_state,
};

function mark_clerk_unavailable(error_code: ClerkErrorCode): false {
  return mark_clerk_lifecycle_unavailable(activation_port, error_code);
}

function start_clerk_initialization(): Promise<boolean> {
  if (initialization_in_flight.status === OptionStatus.SOME)
    return initialization_in_flight.value;
  apply_lifecycle_event({ type: CLERK_LIFECYCLE_EVENT.INITIALIZATION_STARTED });
  if (is_browser_known_offline())
    return Promise.resolve(
      mark_clerk_unavailable(CLERK_ERROR_CODE.BROWSER_OFFLINE),
    );
  const pending = load_and_activate_clerk(activation_port).finally(() => {
    initialization_in_flight = create_none_option();
  });
  initialization_in_flight = create_some_option(pending);
  return pending;
}

export async function initialize_clerk(): Promise<boolean> {
  if (!browser)
    return log_initialization_skipped(CLERK_ERROR_CODE.NOT_IN_BROWSER);
  if (!PUBLIC_CLERK_PUBLISHABLE_KEY) {
    log_initialization_skipped(CLERK_ERROR_CODE.PUBLISHABLE_KEY_MISSING);
    return mark_clerk_unavailable(CLERK_ERROR_CODE.PUBLISHABLE_KEY_MISSING);
  }
  switch (clerk_lifecycle_state.status) {
    case CLERK_LIFECYCLE_STATUS.READY:
      return true;
    case CLERK_LIFECYCLE_STATUS.UNAVAILABLE:
      return false;
    case CLERK_LIFECYCLE_STATUS.UNINITIALIZED:
    case CLERK_LIFECYCLE_STATUS.INITIALIZING:
      return start_clerk_initialization();
  }
}

export function retry_clerk_initialization(): Promise<boolean> {
  if (clerk_lifecycle_state.status === CLERK_LIFECYCLE_STATUS.READY)
    return Promise.resolve(true);
  if (is_browser_known_offline()) return Promise.resolve(false);
  console.log("[Clerk] Retrying initialization", {
    event: CLERK_LOG_EVENT.RETRY_STARTED,
  });
  apply_lifecycle_event({ type: CLERK_LIFECYCLE_EVENT.RETRY_REQUESTED });
  if (!window.Clerk) request_clerk_provider_reload();
  return initialize_clerk();
}

export function suppress_clerk_session_until_signed_out(): boolean {
  console.warn("[Clerk] Session hidden until sign-out completes", {
    event: CLERK_LOG_EVENT.SESSION_SUPPRESSED,
  });
  return set_clerk_session_gate(
    CLERK_SESSION_GATE_STATUS.SUPPRESSED_UNTIL_SIGNED_OUT,
  );
}

export function release_clerk_session_gate(): boolean {
  console.log("[Clerk] Session gate released", {
    event: CLERK_LOG_EVENT.SESSION_GATE_RELEASED,
  });
  set_clerk_session_gate(CLERK_SESSION_GATE_STATUS.OPEN);
  return sync_clerk_state();
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
  if (!is_clerk_session_gate_open()) {
    console.warn("[Clerk] Token withheld until sign-out completes", {
      event: CLERK_LOG_EVENT.TOKEN_SUPPRESSED,
    });
    return create_failure_result(CLERK_MESSAGE.SESSION_SIGNING_OUT);
  }
  return request_clerk_session_token(get_clerk());
}

export async function sign_out(): Promise<Result<true>> {
  expire_clerk_session_cookies();
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
  initialization_in_flight = create_none_option();
  reset_published_clerk_state();
}

export {
  clerk_session,
  is_clerk_loaded,
  is_signed_in,
  set_navigating,
} from "./clerkSessionPublisher";
