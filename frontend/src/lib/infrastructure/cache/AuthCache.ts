import type { Result } from "../../core/types/Result";
import {
  AUTH_CACHE_EVENT,
  CACHE_LOOKUP_STATUS,
  CACHE_MISS_REASON,
  CACHE_STORE_OUTCOME,
} from "./authCacheConstants";

export interface AuthCacheConfig {
  max_entries: number;
  fallback_ttl_ms: number;
}

export interface CacheLookupResult<T> {
  is_hit: boolean;
  value?: T;
}

type CacheMissReason =
  (typeof CACHE_MISS_REASON)[keyof typeof CACHE_MISS_REASON];

export type CacheLookup<T> =
  | { status: typeof CACHE_LOOKUP_STATUS.HIT; value: T }
  | { status: typeof CACHE_LOOKUP_STATUS.MISS; reason: CacheMissReason };

export type CacheStoreOutcome =
  (typeof CACHE_STORE_OUTCOME)[keyof typeof CACHE_STORE_OUTCOME];

export interface CacheStats {
  hits: number;
  misses: number;
  entry_count: number;
}

interface CacheEntry<T> {
  value: T;
  created_at: number;
}

export interface AuthCache<T> {
  lookup(key: string): CacheLookup<T>;
  get_or_miss(key: string): CacheLookupResult<T>;
  set(key: string, value: T): boolean;
  store_successful_result(key: string, result: Result<T>): CacheStoreOutcome;
  invalidate(key: string): boolean;
  invalidate_all(): number;
  get_stats(): CacheStats;
}

function is_entry_expired<T>(
  entry: CacheEntry<T>,
  fallback_ttl_ms: number,
): boolean {
  return Date.now() - entry.created_at >= fallback_ttl_ms;
}

function evict_oldest_entry<T>(entries: Map<string, CacheEntry<T>>): boolean {
  const oldest_key = entries.keys().next().value;
  if (oldest_key === void 0) return false;
  entries.delete(oldest_key);
  return true;
}

function to_legacy_lookup<T>(lookup: CacheLookup<T>): CacheLookupResult<T> {
  switch (lookup.status) {
    case CACHE_LOOKUP_STATUS.HIT:
      return { is_hit: true, value: lookup.value };
    case CACHE_LOOKUP_STATUS.MISS:
      return { is_hit: false };
  }
}

function read_entry<T>(
  entries: Map<string, CacheEntry<T>>,
  key: string,
  fallback_ttl_ms: number,
): CacheLookup<T> {
  const entry = entries.get(key);
  if (!entry)
    return {
      status: CACHE_LOOKUP_STATUS.MISS,
      reason: CACHE_MISS_REASON.ABSENT,
    };
  if (!is_entry_expired(entry, fallback_ttl_ms)) {
    return { status: CACHE_LOOKUP_STATUS.HIT, value: entry.value };
  }
  entries.delete(key);
  return {
    status: CACHE_LOOKUP_STATUS.MISS,
    reason: CACHE_MISS_REASON.EXPIRED,
  };
}

function write_entry<T>(
  entries: Map<string, CacheEntry<T>>,
  max_entries: number,
  key: string,
  value: T,
): boolean {
  if (entries.size >= max_entries && !entries.has(key)) {
    evict_oldest_entry(entries);
  }
  entries.set(key, { value, created_at: Date.now() });
  return true;
}

function store_if_successful<T>(
  set: (key: string, value: T) => boolean,
  key: string,
  result: Result<T>,
): CacheStoreOutcome {
  if (result.success) {
    set(key, result.data);
    return CACHE_STORE_OUTCOME.STORED;
  }
  console.warn("[AuthCache] Failure result not cached", {
    event: AUTH_CACHE_EVENT.FAILURE_NOT_CACHED,
  });
  return CACHE_STORE_OUTCOME.REJECTED_FAILURE;
}

export function create_auth_cache<T>(config: AuthCacheConfig): AuthCache<T> {
  const entries: Map<string, CacheEntry<T>> = new Map();
  const stats = { hits: 0, misses: 0 };

  function lookup(key: string): CacheLookup<T> {
    const result = read_entry(entries, key, config.fallback_ttl_ms);
    switch (result.status) {
      case CACHE_LOOKUP_STATUS.HIT:
        stats.hits++;
        return result;
      case CACHE_LOOKUP_STATUS.MISS:
        stats.misses++;
        return result;
    }
  }

  function set(key: string, value: T): boolean {
    return write_entry(entries, config.max_entries, key, value);
  }

  function invalidate_all(): number {
    const count = entries.size;
    entries.clear();
    return count;
  }

  return {
    lookup,
    get_or_miss: (key: string): CacheLookupResult<T> =>
      to_legacy_lookup(lookup(key)),
    set,
    store_successful_result: (
      key: string,
      result: Result<T>,
    ): CacheStoreOutcome => store_if_successful(set, key, result),
    invalidate: (key: string): boolean => entries.delete(key),
    invalidate_all,
    get_stats: (): CacheStats => ({
      hits: stats.hits,
      misses: stats.misses,
      entry_count: entries.size,
    }),
  };
}
