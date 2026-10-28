import { get } from "svelte/store";

import { create_success_result, type Result } from "$lib/core/types/Result";

import { auth_store } from "../stores/auth";
import { AUTH_GUARD_EVENTS, AUTH_GUARD_MESSAGES } from "./authGuardConstants";
import { with_failure_reason } from "./failureReason";

export function describe_session_failure(error: string): string {
  return with_failure_reason(AUTH_GUARD_MESSAGES.SESSION_UNAVAILABLE, error);
}

export async function initialize_auth_when_needed(): Promise<Result<boolean>> {
  if (get(auth_store).is_initialized) return create_success_result(true);
  console.log("[AuthGuard] Initializing auth", {
    event: AUTH_GUARD_EVENTS.AUTH_INITIALIZATION_STARTED,
  });
  const initialize_result = await auth_store.initialize();
  if (initialize_result.success) return create_success_result(true);
  console.error("[AuthGuard] Auth initialization failed", {
    event: AUTH_GUARD_EVENTS.AUTH_INITIALIZATION_FAILED,
    error: initialize_result.error,
  });
  return { success: false, error: initialize_result.error };
}
