import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, type MutationCtx } from "./_generated/server";
import {
  compute_prune_cutoff_iso,
  MAX_TOMBSTONE_PRUNE_CONTINUATIONS,
  raise_prune_watermark,
  TOMBSTONE_PRUNE_BATCH_SIZE,
} from "./lib/sync_tombstone_retention";
import type { StoredSyncTombstoneDocument } from "./lib/sync_tombstones";
import { is_number } from "./lib/value_guards";

const TOMBSTONE_TABLE_NAME = "sync_tombstones";
const DELETED_AT_INDEX_NAME = "by_deleted_at";
const IMMEDIATE_DELAY_MILLISECONDS = 0;

const TombstonePruneStatus = {
  DRAINED: "drained",
  CONTINUED: "continued",
  CONTINUATION_LIMIT_REACHED: "continuation_limit_reached",
} as const;

type TombstonePruneStatusValue =
  (typeof TombstonePruneStatus)[keyof typeof TombstonePruneStatus];

async function delete_tombstones_and_collect_watermarks(
  ctx: MutationCtx,
  tombstones: StoredSyncTombstoneDocument[],
): Promise<Map<string, number>> {
  const highest_sequence_by_table = new Map<string, number>();
  for (const tombstone of tombstones) {
    await ctx.db.delete(tombstone._id);
    const current_highest = highest_sequence_by_table.get(tombstone.table_name);
    highest_sequence_by_table.set(
      tombstone.table_name,
      is_number(current_highest)
        ? Math.max(current_highest, tombstone.sync_sequence)
        : tombstone.sync_sequence,
    );
  }
  for (const [table_name, sequence] of highest_sequence_by_table)
    await raise_prune_watermark(ctx, table_name, sequence);
  return highest_sequence_by_table;
}

function resolve_prune_status(
  pruned_count: number,
  continuation_count: number,
): TombstonePruneStatusValue {
  if (pruned_count < TOMBSTONE_PRUNE_BATCH_SIZE)
    return TombstonePruneStatus.DRAINED;
  return continuation_count < MAX_TOMBSTONE_PRUNE_CONTINUATIONS
    ? TombstonePruneStatus.CONTINUED
    : TombstonePruneStatus.CONTINUATION_LIMIT_REACHED;
}

export const prune_expired_tombstones_batch = internalMutation({
  args: { retention_days: v.number(), continuation_count: v.number() },
  handler: async (ctx, args) => {
    const cutoff_iso = compute_prune_cutoff_iso(
      Date.now(),
      args.retention_days,
    );
    const expired = (await ctx.db
      .query(TOMBSTONE_TABLE_NAME)
      .withIndex(DELETED_AT_INDEX_NAME, (range) =>
        range.lt("deleted_at", cutoff_iso),
      )
      .take(TOMBSTONE_PRUNE_BATCH_SIZE)) as StoredSyncTombstoneDocument[];
    const watermarks = await delete_tombstones_and_collect_watermarks(
      ctx,
      expired,
    );
    const status = resolve_prune_status(
      expired.length,
      args.continuation_count,
    );
    if (status === TombstonePruneStatus.CONTINUED)
      await ctx.scheduler.runAfter(
        IMMEDIATE_DELAY_MILLISECONDS,
        internal.sync.prune_expired_tombstones_batch,
        {
          retention_days: args.retention_days,
          continuation_count: args.continuation_count + 1,
        },
      );
    console.log("[SyncTombstones] Prune batch finished", {
      event: "sync_tombstone_prune_batch_finished",
      correlation_id: `${cutoff_iso}#${args.continuation_count}`,
      pruned_count: expired.length,
      tables_touched: watermarks.size,
      status,
    });
    return { pruned_count: expired.length, status };
  },
});
