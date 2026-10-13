import type { QueryCtx } from "../_generated/server";
import { strip_convex_fields } from "../sync_record_helpers";
import type { SystemUserRecord } from "./auth_middleware";
import { type ConvexFailure, NO_ERROR_MESSAGE } from "./convex_errors";
import { merge_change_feed_page } from "./sync_change_feed";
import {
  authorize_records_for_reader,
  can_caller_read_table,
} from "./sync_read_authorization";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { filter_visible_tombstones } from "./sync_tombstone_visibility";
import {
  classify_stored_tombstone,
  type StoredSyncTombstoneDocument,
  type SyncTombstone,
} from "./sync_tombstones";

const SYNC_SEQUENCE_INDEX = "by_sync_sequence";
const TOMBSTONE_TABLE_NAME = "sync_tombstones";
const TOMBSTONE_SEQUENCE_INDEX = "by_table_sequence";
const LOOKAHEAD_ROW_COUNT = 1;

export const ChangePageStatus = {
  CHANGES: "changes",
  CURSOR_EXPIRED: "cursor_expired",
  BACKFILL_IN_PROGRESS: "backfill_in_progress",
} as const;

export interface PulledTombstone {
  local_id: string;
  version: number;
  sync_sequence: number;
}

interface ChangePageContent {
  records: Array<Record<string, unknown>>;
  tombstones: PulledTombstone[];
  next_cursor: number;
  has_more: boolean;
}

interface SuccessfulPageHeader {
  success: true;
  error: typeof NO_ERROR_MESSAGE;
}

export type ChangePageResponse =
  | (ChangePageContent &
      SuccessfulPageHeader & { status: typeof ChangePageStatus.CHANGES })
  | (ChangePageContent &
      SuccessfulPageHeader & {
        status: typeof ChangePageStatus.CURSOR_EXPIRED;
        resync_from_sequence: number;
      })
  | (ChangePageContent &
      SuccessfulPageHeader & {
        status: typeof ChangePageStatus.BACKFILL_IN_PROGRESS;
        retry_after_milliseconds: number;
      })
  | (ChangePageContent &
      ConvexFailure & { status: typeof ChangePageStatus.CHANGES });

interface RawChanges {
  records: Array<Record<string, unknown>>;
  tombstones: SyncTombstone[];
}

async function load_raw_changes(
  ctx: QueryCtx,
  table_name: AllowedSyncTable,
  after_sequence: number,
  row_limit: number,
): Promise<RawChanges> {
  const records = (await ctx.db
    .query(table_name)
    .withIndex(SYNC_SEQUENCE_INDEX, (range) =>
      range.gt("sync_sequence", after_sequence),
    )
    .take(row_limit)) as Array<Record<string, unknown>>;
  const tombstone_documents = (await ctx.db
    .query(TOMBSTONE_TABLE_NAME)
    .withIndex(TOMBSTONE_SEQUENCE_INDEX, (range) =>
      range.eq("table_name", table_name).gt("sync_sequence", after_sequence),
    )
    .take(row_limit)) as StoredSyncTombstoneDocument[];
  const tombstones = tombstone_documents.map(classify_stored_tombstone);
  return { records, tombstones };
}

async function project_visible_tombstones(
  ctx: QueryCtx,
  caller: SystemUserRecord,
  table_name: AllowedSyncTable,
  tombstones: SyncTombstone[],
): Promise<PulledTombstone[]> {
  if (!can_caller_read_table(caller, table_name)) return [];
  const visible_tombstones = await filter_visible_tombstones(ctx, {
    caller,
    table_name,
    tombstones,
  });
  return visible_tombstones.map((tombstone) => ({
    local_id: tombstone.local_id,
    version: tombstone.version,
    sync_sequence: tombstone.sync_sequence,
  }));
}

async function filter_visible_records(
  ctx: QueryCtx,
  caller: SystemUserRecord,
  table_name: AllowedSyncTable,
  records: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>> {
  const visible = await authorize_records_for_reader(ctx, {
    records,
    caller,
    table_name,
  });
  return visible.map(strip_convex_fields);
}

export async function read_visible_change_page(
  ctx: QueryCtx,
  command: {
    caller: SystemUserRecord;
    table_name: AllowedSyncTable;
    after_sequence: number;
    page_size: number;
  },
): Promise<ChangePageResponse> {
  const raw = await load_raw_changes(
    ctx,
    command.table_name,
    command.after_sequence,
    command.page_size + LOOKAHEAD_ROW_COUNT,
  );
  const page = merge_change_feed_page({
    ...raw,
    page_size: command.page_size,
    after_sequence: command.after_sequence,
  });
  return {
    success: true,
    status: ChangePageStatus.CHANGES,
    error: NO_ERROR_MESSAGE,
    records: await filter_visible_records(
      ctx,
      command.caller,
      command.table_name,
      page.records,
    ),
    tombstones: await project_visible_tombstones(
      ctx,
      command.caller,
      command.table_name,
      page.tombstones,
    ),
    next_cursor: page.next_cursor,
    has_more: page.has_more,
  };
}
