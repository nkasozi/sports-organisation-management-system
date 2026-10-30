import { ConvexClient } from "convex/browser";

import { api } from "$convex/_generated/api";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { get_clerk_authentication_adapter } from "$lib/adapters/iam/ClerkAuthenticationAdapter";
import { get_session_token } from "$lib/adapters/iam/clerkAuthService";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import {
  type AuthCacheInvalidator,
  create_auth_cache_invalidator,
  type SubscribableConvexClient,
} from "$lib/infrastructure/cache/AuthCacheInvalidator";
import { sync_store } from "$lib/presentation/stores/syncStore";

import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";

const AUTH_CACHE_INVALIDATOR_STATUS = {
  STOPPED: "stopped",
  READY: "ready",
} as const;

type AuthCacheInvalidatorState =
  | { status: typeof AUTH_CACHE_INVALIDATOR_STATUS.STOPPED }
  | {
      status: typeof AUTH_CACHE_INVALIDATOR_STATUS.READY;
      invalidator: AuthCacheInvalidator;
    };

let auth_cache_invalidator_state: AuthCacheInvalidatorState = {
  status: AUTH_CACHE_INVALIDATOR_STATUS.STOPPED,
};

function create_convex_client(convex_url: string): ConvexClient {
  const client = new ConvexClient(convex_url);
  client.setAuth(async () => {
    const token_result = await get_session_token();
    if (!token_result.success) return;
    return token_result.data;
  });
  sync_store.set_convex_client({
    mutation: (name: string, args: Record<string, unknown>) =>
      client.mutation(name as never, args as never),
    query: (name: string, args: Record<string, unknown>) =>
      client.query(name as never, args as never),
  });
  return client;
}

export function is_convex_url_configured(): boolean {
  return Boolean(PUBLIC_CONVEX_URL);
}

export function initialize_convex_client(): Result<ConvexClient> {
  const convex_url = PUBLIC_CONVEX_URL;
  if (!convex_url) {
    console.warn("[Convex] Convex URL not configured, skipping client setup", {
      event: INITIALIZATION_EVENT.CONVEX_URL_NOT_CONFIGURED,
      error_code: INITIALIZATION_ERROR_CODE.CONVEX_URL_MISSING,
    });
    return create_failure_result(
      INITIALIZATION_ERROR_MESSAGE.CONVEX_URL_MISSING,
    );
  }
  try {
    const client = create_convex_client(convex_url);
    console.log("[Convex] Client initialized", {
      event: INITIALIZATION_EVENT.CONVEX_CLIENT_INITIALIZED,
    });
    return create_success_result(client);
  } catch (error) {
    console.error("[Convex] Failed to initialize client", {
      event: INITIALIZATION_EVENT.CONVEX_CLIENT_INITIALIZATION_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.CONVEX_CLIENT_CONSTRUCTION_FAILED,
      error: String(error),
    });
    return create_failure_result(
      INITIALIZATION_ERROR_MESSAGE.CONVEX_CLIENT_FAILED,
    );
  }
}

export function start_auth_cache_invalidation(
  convex_client: ConvexClient,
): boolean {
  if (
    auth_cache_invalidator_state.status ===
      AUTH_CACHE_INVALIDATOR_STATUS.READY &&
    auth_cache_invalidator_state.invalidator.is_running()
  ) {
    return false;
  }

  const local_auth_adapter = get_authentication_adapter(
    get_system_user_repository(),
  );
  const clerk_auth_adapter = get_clerk_authentication_adapter();
  const authz_adapter = get_authorization_adapter();

  const invalidator = create_auth_cache_invalidator({
    convex_client: convex_client as unknown as SubscribableConvexClient,
    caches_to_invalidate: [
      local_auth_adapter.get_verification_cache(),
      clerk_auth_adapter.get_verification_cache(),
      authz_adapter.get_authorization_cache(),
    ],
    queries_to_watch: [api.authorization.get_current_user_profile],
  });
  auth_cache_invalidator_state = {
    status: AUTH_CACHE_INVALIDATOR_STATUS.READY,
    invalidator,
  };

  const started = invalidator.start();
  if (started) {
    console.log("[AppInitializer] Auth cache invalidation started", {
      event: INITIALIZATION_EVENT.AUTH_CACHE_INVALIDATION_STARTED,
    });
  }
  return started;
}

export function stop_auth_cache_invalidation(): boolean {
  if (
    auth_cache_invalidator_state.status !== AUTH_CACHE_INVALIDATOR_STATUS.READY
  ) {
    return false;
  }

  if (!auth_cache_invalidator_state.invalidator.is_running()) {
    return false;
  }

  auth_cache_invalidator_state.invalidator.stop();
  auth_cache_invalidator_state = {
    status: AUTH_CACHE_INVALIDATOR_STATUS.STOPPED,
  };

  return true;
}
