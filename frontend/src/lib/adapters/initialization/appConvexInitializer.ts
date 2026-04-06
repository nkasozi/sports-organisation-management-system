import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { ConvexClient } from "convex/browser";
import { sync_store } from "$lib/presentation/stores/syncStore";
import { get_session_token } from "$lib/adapters/iam/clerkAuthService";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { get_clerk_authentication_adapter } from "$lib/adapters/iam/ClerkAuthenticationAdapter";
import {
  create_auth_cache_invalidator,
  type AuthCacheInvalidator,
  type SubscribableConvexClient,
} from "$lib/infrastructure/cache/AuthCacheInvalidator";
import { api } from "$convex/_generated/api";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { Result } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";

let auth_cache_invalidator: AuthCacheInvalidator | null = null;

export function initialize_convex_client(): Result<ConvexClient> {
  const convex_url = PUBLIC_CONVEX_URL;
  if (!convex_url) {
    console.log(
      "[Convex] No PUBLIC_CONVEX_URL configured, skipping Convex initialization",
    );
    return create_failure_result("No PUBLIC_CONVEX_URL configured");
  }
  try {
    const client = new ConvexClient(convex_url);
    client.setAuth(async () => {
      const token = await get_session_token();
      return token ?? undefined;
    });
    sync_store.set_convex_client({
      mutation: (name: string, args: Record<string, unknown>) =>
        client.mutation(name as never, args as never),
      query: (name: string, args: Record<string, unknown>) =>
        client.query(name as never, args as never),
    });
    console.log(
      "[Convex] Client initialized successfully with URL:",
      convex_url,
    );
    return create_success_result(client);
  } catch (error) {
    console.error("[Convex] Failed to initialize client", {
      event: "failed_to_initialize_client_failed",
      error: String(error),
    });
    return create_failure_result(
      `Failed to initialize Convex client: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function start_auth_cache_invalidation(
  convex_client: ConvexClient,
): boolean {
  if (auth_cache_invalidator?.is_running()) return false;
  const local_auth_adapter = get_authentication_adapter(
    get_system_user_repository(),
  );
  const clerk_auth_adapter = get_clerk_authentication_adapter();
  const authz_adapter = get_authorization_adapter();
  auth_cache_invalidator = create_auth_cache_invalidator({
    convex_client: convex_client as unknown as SubscribableConvexClient,
    caches_to_invalidate: [
      local_auth_adapter.get_verification_cache(),
      clerk_auth_adapter.get_verification_cache(),
      authz_adapter.get_authorization_cache(),
    ],
    queries_to_watch: [api.authorization.get_current_user_profile],
  });
  const started = auth_cache_invalidator.start();
  if (started) {
    console.log(
      "[AppInitializer] Auth cache invalidation started via Convex subscriptions",
    );
  }
  return started;
}

export function stop_auth_cache_invalidation(): boolean {
  if (!auth_cache_invalidator?.is_running()) return false;
  auth_cache_invalidator.stop();
  auth_cache_invalidator = null;
  return true;
}
