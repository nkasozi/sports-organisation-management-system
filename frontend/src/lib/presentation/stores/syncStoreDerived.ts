import { derived, type Readable } from "svelte/store";
import type {
  SyncProgress,
  SyncStatus,
} from "$lib/infrastructure/sync/convexSyncService";
import { sync_store } from "./syncStore";

export const is_syncing: Readable<boolean> = derived(
  sync_store,
  ($s) => $s.is_syncing,
);

export const sync_progress: Readable<SyncProgress | null> = derived(
  sync_store,
  ($s) => $s.current_progress,
);

export const sync_percentage: Readable<number> = derived(
  sync_store,
  ($s) => $s.current_progress?.percentage ?? 0,
);

export const sync_status: Readable<SyncStatus> = derived(sync_store, ($s) =>
  $s.is_syncing ? "syncing" : "idle",
);

export const last_sync_time: Readable<string | null> = derived(
  sync_store,
  ($s) => $s.last_sync_at,
);

export const sync_error: Readable<string | null> = derived(
  sync_store,
  ($s) => $s.error_message,
);

export const has_pending_conflicts: Readable<boolean> = derived(
  sync_store,
  ($s) => $s.has_pending_conflicts,
);
