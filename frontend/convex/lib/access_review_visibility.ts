import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { query_table_dynamically } from "./dynamic_table_query";
import { authorize_records_for_reader } from "./sync_read_authorization";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { TombstoneVisibilityKind } from "./sync_tombstone_scope";
import type { SyncTombstone } from "./sync_tombstones";

const LOCAL_ID_INDEX_NAME = "by_local_id";
const LOCAL_ID_FIELD_NAME = "local_id";

interface AccessReviewCommand {
  caller: SystemUserRecord;
  table_name: AllowedSyncTable;
  tombstones: SyncTombstone[];
}

async function is_record_still_readable(
  ctx: { db: QueryCtx["db"] },
  command: AccessReviewCommand,
  local_id: string,
): Promise<boolean> {
  const current_records = await query_table_dynamically(ctx, command.table_name)
    .withIndex(LOCAL_ID_INDEX_NAME, (range) =>
      range.eq(LOCAL_ID_FIELD_NAME, local_id),
    )
    .take(1);
  if (current_records.length === 0) return false;
  const readable = await authorize_records_for_reader(ctx, {
    caller: command.caller,
    table_name: command.table_name,
    records: current_records,
  });
  return readable.length > 0;
}

export async function drop_access_reviews_still_readable(
  ctx: { db: QueryCtx["db"] },
  command: AccessReviewCommand,
): Promise<SyncTombstone[]> {
  const kept: SyncTombstone[] = [];
  for (const tombstone of command.tombstones) {
    const is_review =
      tombstone.visibility.kind === TombstoneVisibilityKind.ACCESS_REVIEW;
    if (
      !is_review ||
      !(await is_record_still_readable(ctx, command, tombstone.local_id))
    )
      kept.push(tombstone);
  }
  return kept;
}
