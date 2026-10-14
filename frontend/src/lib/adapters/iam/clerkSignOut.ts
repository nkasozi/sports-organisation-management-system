import type { Clerk } from "@clerk/clerk-js";

import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { CLERK_LOG_EVENT, CLERK_MESSAGE } from "./clerkAuthConstants";

const CLERK_SIGN_OUT_TIMEOUT_MS = 8000;

const SIGN_OUT_OUTCOME = {
  COMPLETED: "completed",
  TIMED_OUT: "timed_out",
} as const;

type SignOutOutcome = (typeof SIGN_OUT_OUTCOME)[keyof typeof SIGN_OUT_OUTCOME];

function wait_for_sign_out_timeout(
  timeout_ms: number,
): Promise<SignOutOutcome> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(SIGN_OUT_OUTCOME.TIMED_OUT), timeout_ms),
  );
}

async function request_clerk_sign_out(clerk: Clerk): Promise<SignOutOutcome> {
  await clerk.signOut();
  return SIGN_OUT_OUTCOME.COMPLETED;
}

function fail_sign_out(error: string): Result<true> {
  console.error("[Clerk] Sign out failed", {
    event: CLERK_LOG_EVENT.SIGN_OUT_FAILED,
    error,
  });
  return create_failure_result(CLERK_MESSAGE.SIGN_OUT_FAILED);
}

export async function sign_out_of_clerk(
  clerk: Clerk,
  sync_session_state: () => boolean,
  timeout_ms: number = CLERK_SIGN_OUT_TIMEOUT_MS,
): Promise<Result<true>> {
  try {
    const outcome = await Promise.race([
      request_clerk_sign_out(clerk),
      wait_for_sign_out_timeout(timeout_ms),
    ]);
    if (outcome === SIGN_OUT_OUTCOME.TIMED_OUT)
      return fail_sign_out(SIGN_OUT_OUTCOME.TIMED_OUT);
  } catch (error) {
    return fail_sign_out(String(error));
  }
  sync_session_state();
  console.log("[Clerk] Signed out", { event: CLERK_LOG_EVENT.SIGNED_OUT });
  return create_success_result(true);
}
