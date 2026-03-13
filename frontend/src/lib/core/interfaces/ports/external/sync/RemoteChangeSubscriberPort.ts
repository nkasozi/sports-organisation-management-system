import type { Result } from "$lib/core/types/Result";

export interface RemoteTableTimestamp {
  table_name: string;
  latest_modified_at: string | null;
}

export interface RemoteChangeSubscriberPort {
  start(): Result<boolean>;
  stop(): Result<boolean>;
  is_running(): boolean;
  get_cached_table_timestamps(): Record<string, string | null>;
}
