import { v } from "convex/values";

import { query } from "./_generated/server";
import { require_auth } from "./lib/auth_middleware";
import { type ConvexFailure, NO_ERROR_MESSAGE } from "./lib/convex_errors";
import { BackfillStatus } from "./lib/sync_backfill_state";
import { read_table_backfill_status } from "./lib/sync_backfill_store";
import {
  clamp_change_page_size,
  DEFAULT_CHANGE_PAGE_SIZE,
} from "./lib/sync_change_feed";
import {
  type ChangePageResponse,
  ChangePageStatus,
  type PulledTombstone,
  read_visible_change_page,
} from "./lib/sync_change_page_reader";
import {
  is_cursor_expired,
  read_prune_watermark,
} from "./lib/sync_tombstone_retention";
import { validate_table_name } from "./lib/sync_validation";

const RESYNC_FROM_SEQUENCE = 0;
const BACKFILL_RETRY_AFTER_MILLISECONDS = 30_000;

function build_empty_page(
  failure: ConvexFailure,
  after_sequence: number,
): ChangePageResponse {
  return {
    ...failure,
    status: ChangePageStatus.CHANGES,
    records: [],
    tombstones: [] as PulledTombstone[],
    next_cursor: after_sequence,
    has_more: false,
  };
}

function build_cursor_expired_page(after_sequence: number): ChangePageResponse {
  return {
    success: true,
    status: ChangePageStatus.CURSOR_EXPIRED,
    error: NO_ERROR_MESSAGE,
    records: [],
    tombstones: [] as PulledTombstone[],
    next_cursor: after_sequence,
    has_more: false,
    resync_from_sequence: RESYNC_FROM_SEQUENCE,
  };
}

function build_backfill_in_progress_page(
  after_sequence: number,
): ChangePageResponse {
  return {
    success: true,
    status: ChangePageStatus.BACKFILL_IN_PROGRESS,
    error: NO_ERROR_MESSAGE,
    records: [],
    tombstones: [] as PulledTombstone[],
    next_cursor: after_sequence,
    has_more: false,
    retry_after_milliseconds: BACKFILL_RETRY_AFTER_MILLISECONDS,
  };
}

export const get_changes_page = query({
  args: {
    table_name: v.string(),
    after_sequence: v.number(),
    page_size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return build_empty_page(table_validation, args.after_sequence);
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return build_empty_page(auth_result, args.after_sequence);
    const backfill_status = await read_table_backfill_status(
      ctx,
      table_validation.data,
    );
    if (backfill_status !== BackfillStatus.COMPLETE)
      return build_backfill_in_progress_page(args.after_sequence);
    const watermark = await read_prune_watermark(ctx, table_validation.data);
    if (is_cursor_expired(args.after_sequence, watermark))
      return build_cursor_expired_page(args.after_sequence);
    return read_visible_change_page(ctx, {
      caller: auth_result.data,
      table_name: table_validation.data,
      after_sequence: args.after_sequence,
      page_size: clamp_change_page_size(
        args.page_size ?? DEFAULT_CHANGE_PAGE_SIZE,
      ),
    });
  },
});
