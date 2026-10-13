import {
  build_sync_outbox_key,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import { is_record_value } from "../utils/runtimeTypeGuards";
import {
  build_tombstone_version_row,
  read_known_record_version,
  read_known_version_number,
} from "./syncRecordVersionRows";
import {
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";

const NO_REMOTE_VERSION = 0;

function read_remote_version(entry: unknown): number {
  if (!is_record_value(entry)) return NO_REMOTE_VERSION;
  return entry.status === SyncOutboxEntryStatus.CONFLICTED
    ? Number(entry.remote_version)
    : NO_REMOTE_VERSION;
}

export async function discard_remotely_deleted_change(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  local_id: string,
): AsyncResult<boolean> {
  await run_remote_apply_transaction(
    dependencies,
    table_name,
    async (tables) => {
      const key = build_sync_outbox_key(table_name, local_id);
      const tombstone_version = Math.max(
        read_remote_version(await tables.outbox.get(key)),
        read_known_version_number(
          read_known_record_version(await tables.versions.get(key)),
        ),
      );
      await tables.data.delete(local_id);
      await tables.versions.put(
        build_tombstone_version_row(table_name, local_id, tombstone_version),
      );
      await tables.outbox.delete(key);
      return true;
    },
  );
  console.log("[Sync:Review] Local copy of a remotely deleted record removed", {
    event: "sync_review_remote_deletion_accepted",
    table_name,
    local_id,
  });
  return create_success_result(true);
}
