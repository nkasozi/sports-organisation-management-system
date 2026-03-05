export interface AuthCacheConfig {
  max_entries: number;
  fallback_ttl_ms: number;
}

export interface CacheLookupResult<T> {
  is_hit: boolean;
  value: T | undefined;
}

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
  get_or_miss(key: string): CacheLookupResult<T>;
  set(key: string, value: T): boolean;
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
  if (oldest_key === undefined) return false;
  entries.delete(oldest_key);
  return true;
}

export function create_auth_cache<T>(config: AuthCacheConfig): AuthCache<T> {
  const entries: Map<string, CacheEntry<T>> = new Map();
  let hit_count = 0;
  let miss_count = 0;

  function get_or_miss(key: string): CacheLookupResult<T> {
    const entry = entries.get(key);

    if (!entry || is_entry_expired(entry, config.fallback_ttl_ms)) {
      if (entry) entries.delete(key);
      miss_count++;
      return { is_hit: false, value: undefined };
    }

    hit_count++;
    return { is_hit: true, value: entry.value };
  }

  function set(key: string, value: T): boolean {
    if (entries.size >= config.max_entries && !entries.has(key)) {
      evict_oldest_entry(entries);
    }

    entries.set(key, { value, created_at: Date.now() });
    return true;
  }

  function invalidate(key: string): boolean {
    return entries.delete(key);
  }

  function invalidate_all(): number {
    const count = entries.size;
    entries.clear();
    return count;
  }

  function get_stats(): CacheStats {
    return {
      hits: hit_count,
      misses: miss_count,
      entry_count: entries.size,
    };
  }

  return { get_or_miss, set, invalidate, invalidate_all, get_stats };
}
