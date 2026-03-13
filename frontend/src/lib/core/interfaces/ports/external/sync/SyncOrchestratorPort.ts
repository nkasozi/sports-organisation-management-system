import type { AsyncResult } from "$lib/core/types/Result";

export type SyncDirection = "push" | "pull" | "bidirectional";

export interface SyncMetrics {
  tables_synced: number;
  records_pushed: number;
  records_pulled: number;
  duration_ms: number;
  conflicts: Array<{ table_name: string; conflicts: unknown[] }>;
}

export interface SyncTableError {
  failed_tables: Array<{ table_name: string; error: string }>;
  message: string;
}

export interface SyncHints {
  remote_timestamp_cache?: Record<string, string | null>;
  use_fresh_timestamps?: boolean;
}

export interface SyncOrchestratorPort {
  sync_now(
    direction?: SyncDirection,
    hints?: SyncHints,
  ): AsyncResult<SyncMetrics, SyncTableError>;
  is_configured(): boolean;
}
