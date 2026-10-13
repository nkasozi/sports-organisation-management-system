import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { can_caller_read_table } from "./sync_read_authorization";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { filter_visible_tombstones } from "./sync_tombstone_visibility";
import {
  classify_stored_tombstone,
  type StoredSyncTombstoneDocument,
} from "./sync_tombstones";

const RecordAbsenceReason = {
  NEVER_EXISTED: "never_existed",
  DELETED: "deleted",
  NOT_VISIBLE: "not_visible",
} as const;

export type RecordAbsence =
  | { reason: typeof RecordAbsenceReason.NEVER_EXISTED }
  | { reason: typeof RecordAbsenceReason.NOT_VISIBLE }
  | { reason: typeof RecordAbsenceReason.DELETED; tombstone_version: number };

const TOMBSTONE_TABLE_NAME = "sync_tombstones";
const TOMBSTONE_LOCAL_ID_INDEX = "by_table_local_id";

export const NOT_VISIBLE_ABSENCE: RecordAbsence = {
  reason: RecordAbsenceReason.NOT_VISIBLE,
};

export async function resolve_missing_record_absence(
  ctx: { db: QueryCtx["db"] },
  command: {
    caller: SystemUserRecord;
    table_name: AllowedSyncTable;
    local_id: string;
  },
): Promise<RecordAbsence> {
  const stored_tombstone = await ctx.db
    .query(TOMBSTONE_TABLE_NAME)
    .withIndex(TOMBSTONE_LOCAL_ID_INDEX, (range) =>
      range
        .eq("table_name", command.table_name)
        .eq("local_id", command.local_id),
    )
    .first();
  if (!stored_tombstone) return { reason: RecordAbsenceReason.NEVER_EXISTED };
  const tombstone = classify_stored_tombstone(
    stored_tombstone as StoredSyncTombstoneDocument,
  );
  const visible = can_caller_read_table(command.caller, command.table_name)
    ? await filter_visible_tombstones(ctx, {
        caller: command.caller,
        table_name: command.table_name,
        tombstones: [tombstone],
      })
    : [];
  return visible.length === 0
    ? NOT_VISIBLE_ABSENCE
    : {
        reason: RecordAbsenceReason.DELETED,
        tombstone_version: tombstone.version,
      };
}
