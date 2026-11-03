import type { Clerk } from "@clerk/clerk-js";

import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";

import { DexieAppSettingsAdapter } from "../persistence/DexieAppSettingsAdapter";
import { CLERK_LOG_EVENT, CLERK_MESSAGE } from "./clerkAuthConstants";
import {
  clear_cached_session_token,
  get_cached_or_fresh_session_token,
} from "./clerkCachedSessionToken";
import { request_clerk_session_token } from "./clerkSessionToken";

const session_token_storage = new DexieAppSettingsAdapter();

interface SessionTokenProviderRequest {
  is_session_gate_open: boolean;
  clerk_result: Result<Clerk>;
  force_refresh: boolean;
}

function read_current_session_id(clerk_result: Result<Clerk>): Option<string> {
  return clerk_result.success && clerk_result.data.session
    ? create_some_option(clerk_result.data.session.id)
    : create_none_option();
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
      current_session_id: read_current_session_id(request.clerk_result),
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
