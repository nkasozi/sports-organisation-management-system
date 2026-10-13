import type { Clerk } from "@clerk/clerk-js";

import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  CLERK_LOG_EVENT,
  CLERK_MESSAGE,
  CONVEX_TOKEN_TEMPLATE,
} from "./clerkAuthConstants";

type ClerkActiveSession = NonNullable<Clerk["session"]>;

async function request_token_from_session(
  session: ClerkActiveSession,
): Promise<Result<string>> {
  try {
    const token = await session.getToken({ template: CONVEX_TOKEN_TEMPLATE });
    if (token) return create_success_result(token);
    console.warn("[Clerk] Session token was empty", {
      event: CLERK_LOG_EVENT.TOKEN_EMPTY,
      session_id: session.id,
    });
    return create_failure_result(CLERK_MESSAGE.TOKEN_UNAVAILABLE);
  } catch (error) {
    console.error("[Clerk] Failed to get session token", {
      event: CLERK_LOG_EVENT.TOKEN_REQUEST_FAILED,
      session_id: session.id,
      error: String(error),
    });
    return create_failure_result(CLERK_MESSAGE.TOKEN_REQUEST_FAILED);
  }
}

export async function request_clerk_session_token(
  clerk_result: Result<Clerk>,
): Promise<Result<string>> {
  if (!clerk_result.success || !clerk_result.data.session) {
    console.log("[Clerk] No session available for token", {
      event: CLERK_LOG_EVENT.TOKEN_NO_SESSION,
    });
    return create_failure_result(CLERK_MESSAGE.NO_SESSION);
  }
  return request_token_from_session(clerk_result.data.session);
}
