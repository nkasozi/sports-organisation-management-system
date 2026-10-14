import { get } from "svelte/store";

import { create_failure_result } from "$lib/core/types/Result";
import { get_sync_manager } from "$lib/infrastructure/sync/syncManager";
import { load_server_copy } from "$lib/infrastructure/sync/syncOutboxReviewServerCopy";

import { conflict_store } from "./conflictStore";
import { sync_review_store } from "./conflictStoreSyncReviewInstance";
import type { ConflictOutcomeDependencies } from "./syncStoreConflictOutcome";

const OFFLINE_RELOAD_MESSAGE =
  "Connect to the internet to load the latest saved copy.";

export const conflict_outcome_dependencies: ConflictOutcomeDependencies = {
  mark_resolved: (conflict_id, action, merged_data) =>
    conflict_store.resolve_conflict(conflict_id, action, merged_data).success,
  refresh_remote_copy: (conflict_id, remote_data, remote_version) =>
    conflict_store.refresh_conflict_remote_copy(
      conflict_id,
      remote_data,
      remote_version,
    ),
  remove_conflict: (conflict_id) => conflict_store.remove_conflict(conflict_id),
  add_remote_deletion: (deletion) =>
    sync_review_store.add_remote_deletion(deletion),
  load_server_copy: async (table_name, local_id) => {
    const client = get_sync_manager().get_convex_client();
    if (!client.success) return create_failure_result(OFFLINE_RELOAD_MESSAGE);
    return load_server_copy(
      { convex_client: client.data },
      table_name,
      local_id,
    );
  },
};

export function has_pending_conflicts_in_store(): boolean {
  return get(conflict_store).pending_conflicts.length > 0;
}
