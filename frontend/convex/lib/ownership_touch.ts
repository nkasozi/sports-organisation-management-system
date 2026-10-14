import type { MutationCtx } from "../_generated/server";
import type { StoredRow } from "./dynamic_table_query";
import { write_access_review_tombstone } from "./sync_access_review_tombstones";
import { create_sync_change_stamp } from "./sync_change_stamp";
import { read_document_id, read_record_version } from "./sync_record_store";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { read_string_or } from "./value_guards";

const VERSION_INCREMENT = 1;
const EMPTY_VALUE = "";

export async function touch_projected_row(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  row: StoredRow,
): Promise<boolean> {
  const stamp = await create_sync_change_stamp(ctx, {
    table_name,
    changed_records: [row],
  });
  await ctx.db.patch(read_document_id(row), stamp as never);
  return true;
}

export async function touch_owned_row(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  row: StoredRow,
): Promise<boolean> {
  const version = read_record_version(row) + VERSION_INCREMENT;
  const record_stamp = await create_sync_change_stamp(ctx, {
    table_name,
    changed_records: [row],
  });
  await ctx.db.patch(read_document_id(row), {
    ...record_stamp,
    version,
  } as never);
  const review_stamp = await create_sync_change_stamp(ctx, {
    table_name,
    changed_records: [row],
  });
  return write_access_review_tombstone(ctx, {
    table_name,
    local_id: read_string_or(row.local_id, EMPTY_VALUE),
    record: row,
    version,
    sync_sequence: review_stamp.sync_sequence,
    reviewed_at: review_stamp.synced_at,
  });
}
