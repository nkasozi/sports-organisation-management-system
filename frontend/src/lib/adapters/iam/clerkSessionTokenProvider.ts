import type { Clerk } from "@clerk/clerk-js";

import type { Result } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";

import { DexieAppSettingsAdapter } from "../persistence/DexieAppSettingsAdapter";
import { CLERK_LOG_EVENT, CLERK_MESSAGE } from "./clerkAuthConstants";
import {
  clear_cached_session_token,
  CLERK_SESSION_STATE,
  type ClerkSessionState,
  get_cached_or_fresh_session_token,
} from "./clerkCachedSessionToken";
import { request_clerk_session_token } from "./clerkSessionToken";

const session_token_storage = new DexieAppSettingsAdapter();

interface SessionTokenProviderRequest {
  is_session_gate_open: boolean;
  clerk_result: Result<Clerk>;
  force_refresh: boolean;
}

function read_clerk_session_state(
  clerk_result: Result<Clerk>,
): ClerkSessionState {
  if (!clerk_result.success) return { status: CLERK_SESSION_STATE.UNAVAILABLE };
  return clerk_result.data.session
    ? {
        status: CLERK_SESSION_STATE.SIGNED_IN,
        session_id: clerk_result.data.session.id,
      }
    : { status: CLERK_SESSION_STATE.SIGNED_OUT };
}

function provide_session_token(
  request: SessionTokenProviderRequest,
): Promise<Result<string>> {
  if (!request.is_session_gate_open) {
    console.warn("[Clerk] Token withheld until sign-out completes", {
      event: CLERK_LOG_EVENT.TOKEN_SUPPRESSED,
    });
    return Promise.resolve(
      create_failure_result(CLERK_MESSAGE.SESSION_SIGNING_OUT),
    );
  }
  return get_cached_or_fresh_session_token(
    {
      storage: session_token_storage,
      now_ms: Date.now,
      clerk_session: read_clerk_session_state(request.clerk_result),
      request_fresh_token: () =>
        request_clerk_session_token(request.clerk_result),
    },
    { force_refresh: request.force_refresh },
  );
}

interface SessionTokenFunctions {
  get_session_token(): Promise<Result<string>>;
  refresh_session_token(): Promise<Result<string>>;
  forget_session_token(): Promise<boolean>;
}

export function create_session_token_functions(
  is_session_gate_open: () => boolean,
  get_clerk: () => Result<Clerk>,
): SessionTokenFunctions {
  const provide = (force_refresh: boolean): Promise<Result<string>> =>
    provide_session_token({
      is_session_gate_open: is_session_gate_open(),
      clerk_result: get_clerk(),
      force_refresh,
    });
  return {
    get_session_token: () => provide(false),
    refresh_session_token: () => provide(true),
    forget_session_token: () =>
      clear_cached_session_token(session_token_storage),
  };
}
