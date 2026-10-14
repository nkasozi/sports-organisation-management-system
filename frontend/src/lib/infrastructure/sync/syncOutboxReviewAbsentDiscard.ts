import {
  build_sync_outbox_key,
  type SyncOutboxEntry,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { build_tombstone_version_row } from "./syncRecordVersionRows";
import {
  type GenericTable,
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";

const NO_LONGER_WAITING_ERROR =
  "This change is no longer waiting for a decision";

export const ServerAbsenceReason = {
  NEVER_EXISTED: "never_existed",
  DELETED: "deleted",
  NOT_VISIBLE: "not_visible",
  UNREPORTED: "unreported",
} as const;

export type ServerAbsence =
  | { reason: typeof ServerAbsenceReason.NEVER_EXISTED }
  | { reason: typeof ServerAbsenceReason.NOT_VISIBLE }
  | { reason: typeof ServerAbsenceReason.UNREPORTED }
  | { reason: typeof ServerAbsenceReason.DELETED; tombstone_version: number };

type ReportedServerAbsence = Exclude<
  ServerAbsence,
  { reason: typeof ServerAbsenceReason.UNREPORTED }
>;

async function update_version_row(
  versions: GenericTable,
  entry: SyncOutboxEntry,
  absence: ReportedServerAbsence,
): Promise<unknown> {
  const key = build_sync_outbox_key(entry.table_name, entry.local_id);
  switch (absence.reason) {
    case ServerAbsenceReason.DELETED:
      return versions.put(
        build_tombstone_version_row(
          entry.table_name,
          entry.local_id,
          absence.tombstone_version,
        ),
      );
    case ServerAbsenceReason.NOT_VISIBLE:
    case ServerAbsenceReason.NEVER_EXISTED:
      return versions.delete(key);
  }
}

async function drop_local_copy_if_unchanged(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  absence: ReportedServerAbsence,
): Promise<boolean> {
  return run_remote_apply_transaction(
    dependencies,
    entry.table_name,
    async (tables) => {
      const key = build_sync_outbox_key(entry.table_name, entry.local_id);
      const current = await tables.outbox.get(key);
      if (!current || current.change_token !== entry.change_token) return false;
      await tables.data.delete(entry.local_id);
      await tables.outbox.delete(key);
      await update_version_row(tables.versions, entry, absence);
      return true;
    },
  );
}

export async function discard_change_for_absent_server_copy(
  dependencies: RemoteApplyDependencies,
  entry: SyncOutboxEntry,
  absence: ReportedServerAbsence,
): AsyncResult<boolean> {
  const dropped = await drop_local_copy_if_unchanged(
    dependencies,
    entry,
    absence,
  );
  console.log("[Sync:Review] Rejected change discarded; server copy is gone", {
    event: dropped
      ? "sync_review_absent_server_copy_discarded"
      : "sync_review_absent_server_copy_discard_skipped",
    table_name: entry.table_name,
    local_id: entry.local_id,
    absence_reason: absence.reason,
  });
  return dropped
    ? create_success_result(true)
    : create_failure_result(NO_LONGER_WAITING_ERROR);
}
