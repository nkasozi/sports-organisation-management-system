import { get_database } from "$lib/adapters/repositories/database";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { create_failure_result } from "$lib/core/types/Result";
import { get_sync_manager } from "$lib/infrastructure/sync/syncManager";
import {
  discard_rejected_change,
  discard_remotely_deleted_change,
  list_rejected_changes,
  requeue_conflicted_entries,
  requeue_rejected_change,
  restore_remotely_deleted_change,
} from "$lib/infrastructure/sync/syncOutboxReview";
import { request_push_for_reviewed_changes } from "$lib/infrastructure/sync/syncPushKick";
import type { RemoteApplyDependencies } from "$lib/infrastructure/sync/syncRemoteApply";

import { create_sync_review_store } from "./conflictStoreSyncReview";

const OFFLINE_DISCARD_MESSAGE =
  "Connect to the internet to load the saved copy before discarding your change.";

function remote_apply_dependencies(): RemoteApplyDependencies {
  return { database: get_database(), gate: sync_change_tracking_gate };
}

export const sync_review_store = create_sync_review_store({
  restore_remotely_deleted: (table_name, local_id) =>
    restore_remotely_deleted_change(get_database(), table_name, local_id),
  discard_remotely_deleted: (table_name, local_id) =>
    discard_remotely_deleted_change(
      remote_apply_dependencies(),
      table_name,
      local_id,
    ),
  retry_rejected: (table_name, local_id) =>
    requeue_rejected_change(get_database(), table_name, local_id),
  discard_rejected: async (table_name, local_id) => {
    const client = get_sync_manager().get_convex_client();
    if (!client.success) return create_failure_result(OFFLINE_DISCARD_MESSAGE);
    return discard_rejected_change(
      { ...remote_apply_dependencies(), convex_client: client.data },
      table_name,
      local_id,
    );
  },
  requeue_conflicts: () => requeue_conflicted_entries(get_database()),
  list_rejected: () => list_rejected_changes(get_database()),
  request_push: request_push_for_reviewed_changes,
});
