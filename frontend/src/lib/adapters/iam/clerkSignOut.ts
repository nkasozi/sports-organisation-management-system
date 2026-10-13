import type { Clerk } from "@clerk/clerk-js";

import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { CLERK_LOG_EVENT, CLERK_MESSAGE } from "./clerkAuthConstants";

export async function sign_out_of_clerk(
  clerk: Clerk,
  sync_session_state: () => boolean,
): Promise<Result<true>> {
  try {
    await clerk.signOut();
  } catch (error) {
    console.error("[Clerk] Sign out failed", {
      event: CLERK_LOG_EVENT.SIGN_OUT_FAILED,
      error: String(error),
    });
    return create_failure_result(CLERK_MESSAGE.SIGN_OUT_FAILED);
  }
  sync_session_state();
  console.log("[Clerk] Signed out", { event: CLERK_LOG_EVENT.SIGNED_OUT });
  return create_success_result(true);
}
