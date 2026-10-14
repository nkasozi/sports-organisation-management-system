import {
  CLERK_ERROR_CODE,
  CLERK_LOG_EVENT,
  type ClerkErrorCode,
} from "./clerkAuthConstants";
import { LOADED_SIGNED_OUT_CLERK_STATE } from "./clerkAuthTypes";
import {
  type ClerkLoadOutcome,
  wait_for_loaded_clerk,
} from "./clerkInstanceLoader";
import {
  CLERK_LIFECYCLE_EVENT,
  type ClerkLifecycleEvent,
  type ClerkLifecycleState,
} from "./clerkLifecycleState";
import { publish_clerk_state } from "./clerkSessionPublisher";
import { build_clerk_session_state } from "./clerkSessionStateBuilders";

export interface ClerkActivationPort {
  apply_lifecycle_event(event: ClerkLifecycleEvent): ClerkLifecycleState;
  sync_clerk_state(): boolean;
}

export function mark_clerk_lifecycle_unavailable(
  port: ClerkActivationPort,
  error_code: ClerkErrorCode,
): false {
  port.apply_lifecycle_event({
    type: CLERK_LIFECYCLE_EVENT.CLERK_UNAVAILABLE,
    error_code,
  });
  publish_clerk_state(LOADED_SIGNED_OUT_CLERK_STATE);
  return false;
}

function activate_clerk_instance(
  port: ClerkActivationPort,
  load_outcome: ClerkLoadOutcome,
): true {
  const clerk = load_outcome.clerk;
  port.apply_lifecycle_event({
    type: CLERK_LIFECYCLE_EVENT.CLERK_ACTIVATED,
    clerk,
  });
  publish_clerk_state(build_clerk_session_state(clerk));
  clerk.addListener(() => {
    port.sync_clerk_state();
  });
  console.log("[Clerk] Initialized via ClerkProvider", {
    event: CLERK_LOG_EVENT.INITIALIZED,
    load_status: load_outcome.status,
  });
  return true;
}

export async function load_and_activate_clerk(
  port: ClerkActivationPort,
): Promise<boolean> {
  try {
    const clerk_result = await wait_for_loaded_clerk();
    if (!clerk_result.success)
      return mark_clerk_lifecycle_unavailable(
        port,
        CLERK_ERROR_CODE.LOAD_TIMED_OUT,
      );
    return activate_clerk_instance(port, clerk_result.data);
  } catch (error) {
    console.error("[Clerk] Failed to initialize", {
      event: CLERK_LOG_EVENT.INITIALIZATION_FAILED,
      error_code: CLERK_ERROR_CODE.INITIALIZATION_THREW,
      error: String(error),
    });
    return mark_clerk_lifecycle_unavailable(
      port,
      CLERK_ERROR_CODE.INITIALIZATION_THREW,
    );
  }
}
