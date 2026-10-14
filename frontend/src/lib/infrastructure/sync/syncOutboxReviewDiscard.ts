import {
  build_sync_outbox_key,
  SyncBaseVersionKind,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { outbox_table } from "./syncOutboxRepository";
import {
  discard_change_for_absent_server_copy,
  type ServerAbsence,
  ServerAbsenceReason,
} from "./syncOutboxReviewAbsentDiscard";
import {
  load_server_copy,
  ServerCopyStatus,
} from "./syncOutboxReviewServerCopy";
import {
  KnownRecordVersionKind,
  read_known_record_version,
} from "./syncRecordVersionRows";
import {
  convert_server_record_to_remote_change,
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";
import type { ConvexClient } from "./syncTypes";

const NO_LONGER_WAITING_ERROR =
  "This change is no longer waiting for a decision";
const SERVER_COPY_NOT_VISIBLE_ERROR =
  "The saved copy of this record is not available to your account, so your change was kept. Retry it or ask an administrator for access.";

interface DiscardRejectedDependencies extends RemoteApplyDependencies {
  convex_client: ConvexClient;
}

const NeverSyncedDiscardOutcome = {
  REMOVED: "removed",
  CHANGED_DURING_REVIEW: "changed_during_review",
  SYNCED_BEFORE: "synced_before",
} as const;

type NeverSyncedDiscardOutcomeValue =
  (typeof NeverSyncedDiscardOutcome)[keyof typeof NeverSyncedDiscardOutcome];

function was_synced_before(
  entry: SyncOutboxEntry,
  version_row: unknown,
): boolean {
  return (
    entry.base_version.kind === SyncBaseVersionKind.KNOWN ||
    read_known_record_version(version_row).kind !== KnownRecordVersionKind.NONE
  );
}

async function remove_never_synced_record(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
): Promise<NeverSyncedDiscardOutcomeValue> {
  return run_remote_apply_transaction(
    dependencies,
    entry.table_name,
    async (tables) => {
      const key = build_sync_outbox_key(entry.table_name, entry.local_id);
      const current = await tables.outbox.get(key);
      if (!current || current.change_token !== entry.change_token)
        return NeverSyncedDiscardOutcome.CHANGED_DURING_REVIEW;
      if (was_synced_before(entry, await tables.versions.get(key)))
        return NeverSyncedDiscardOutcome.SYNCED_BEFORE;
      await tables.data.delete(entry.local_id);
      await tables.outbox.delete(key);
      return NeverSyncedDiscardOutcome.REMOVED;
    },
  );
}

async function discard_never_synced_change(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
): AsyncResult<boolean> {
  const outcome = await remove_never_synced_record(dependencies, entry);
  switch (outcome) {
    case NeverSyncedDiscardOutcome.REMOVED:
      return create_success_result(true);
    case NeverSyncedDiscardOutcome.CHANGED_DURING_REVIEW:
      return create_failure_result(NO_LONGER_WAITING_ERROR);
    case NeverSyncedDiscardOutcome.SYNCED_BEFORE:
      console.warn("[Sync:Review] Server copy is not available to discard to", {
        event: "sync_review_server_copy_not_visible",
        table_name: entry.table_name,
        local_id: entry.local_id,
      });
      return create_failure_result(SERVER_COPY_NOT_VISIBLE_ERROR);
  }
}

async function read_waiting_rejected_entry(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  local_id: string,
): AsyncResult<SyncOutboxEntry> {
  const entry = await outbox_table(dependencies.database).get(
    build_sync_outbox_key(table_name, local_id),
  );
  return entry && entry.status === SyncOutboxEntryStatus.REJECTED
    ? create_success_result(entry)
    : create_failure_result(NO_LONGER_WAITING_ERROR);
}

async function restore_server_copy(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  record: Record<string, unknown>,
): AsyncResult<boolean> {
  await apply_resolved_remote_record(
    dependencies,
    entry.table_name,
    convert_server_record_to_remote_change({
      ...record,
      local_id: entry.local_id,
    }),
    {
      kind: ResolvedRecordGuardKind.CHANGE_TOKEN,
      change_token: entry.change_token,
    },
  );
  console.log("[Sync:Review] Rejected change discarded for the server copy", {
    event: "sync_review_rejected_change_discarded",
    table_name: entry.table_name,
    local_id: entry.local_id,
  });
  return create_success_result(true);
}

function discard_for_absence(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  absence: ServerAbsence,
): AsyncResult<boolean> {
  switch (absence.reason) {
    case ServerAbsenceReason.UNREPORTED:
      return discard_never_synced_change(dependencies, entry);
    case ServerAbsenceReason.NEVER_EXISTED:
    case ServerAbsenceReason.NOT_VISIBLE:
    case ServerAbsenceReason.DELETED:
      return discard_change_for_absent_server_copy(
        dependencies,
        entry,
        absence,
      );
  }
}

export async function discard_rejected_change(
  dependencies: DiscardRejectedDependencies,
  table_name: string,
  local_id: string,
): AsyncResult<boolean> {
  const waiting = await read_waiting_rejected_entry(
    dependencies,
    table_name,
    local_id,
  );
  if (!waiting.success) return waiting;
  const server_copy = await load_server_copy(
    dependencies,
    table_name,
    local_id,
  );
  if (!server_copy.success) return server_copy;
  switch (server_copy.data.status) {
    case ServerCopyStatus.NOT_FOUND:
      return discard_for_absence(
        dependencies,
        waiting.data,
        server_copy.data.absence,
      );
    case ServerCopyStatus.FOUND:
      return restore_server_copy(
        dependencies,
        waiting.data,
        server_copy.data.record,
      );
  }
}
