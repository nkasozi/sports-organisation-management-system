import type { Option } from "$lib/core/types/Option";
import { create_none_option, create_some_option } from "$lib/core/types/Option";
import type { AuthCache } from "$lib/infrastructure/cache/AuthCache";
import { CACHE_LOOKUP_STATUS } from "$lib/infrastructure/cache/authCacheConstants";

import { IAM_LOG_EVENT } from "./iamConstants";

export function build_authorization_cache_key(
  prefix: string,
  key_parts: readonly string[],
): string {
  return [prefix, ...key_parts].join(":");
}

export function read_authorization_cache<TValue>(
  authorization_cache: AuthCache<unknown>,
  cache_key: string,
  cache_prefix: string,
): Option<TValue> {
  const cached = authorization_cache.lookup(cache_key);
  if (cached.status !== CACHE_LOOKUP_STATUS.HIT) return create_none_option();
  console.debug("[LocalAuthorizationAdapter] Authorization cache hit", {
    event: IAM_LOG_EVENT.AUTHORIZATION_CACHE_HIT,
    cache_prefix,
  });
  return create_some_option(cached.value as TValue);
}
