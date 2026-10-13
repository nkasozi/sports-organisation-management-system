export const CACHE_LOOKUP_STATUS = {
  HIT: "hit",
  MISS: "miss",
} as const;

export const CACHE_MISS_REASON = {
  ABSENT: "absent",
  EXPIRED: "expired",
} as const;

export const CACHE_STORE_OUTCOME = {
  STORED: "stored",
  REJECTED_FAILURE: "rejected_failure",
} as const;

export const AUTH_SNAPSHOT_STATUS = {
  EMPTY: "empty",
  READY: "ready",
} as const;

export const INVALIDATOR_STATUS = {
  STOPPED: "stopped",
  RUNNING: "running",
} as const;

export const AUTH_CACHE_EVENT = {
  FAILURE_NOT_CACHED: "auth_cache_failure_not_cached",
  INVALIDATED_ON_CHANGE: "auth_cache_invalidated_on_change",
  INVALIDATOR_STARTED: "auth_cache_invalidator_started",
  INVALIDATOR_STOPPED: "auth_cache_invalidator_stopped",
} as const;
