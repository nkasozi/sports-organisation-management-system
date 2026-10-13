import type { MutationCtx, QueryCtx } from "../_generated/server";

export const SYNC_TOMBSTONE_RETENTION_DAYS = 90;
export const TOMBSTONE_PRUNE_BATCH_SIZE = 200;
export const MAX_TOMBSTONE_PRUNE_CONTINUATIONS = 50;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const WATERMARK_TABLE_NAME = "sync_prune_watermarks";
const WATERMARK_INDEX_NAME = "by_table";
const NOTHING_PRUNED_SEQUENCE = 0;
const INITIAL_CURSOR_SEQUENCE = 0;

export function compute_prune_cutoff_iso(
  now_milliseconds: number,
  retention_days: number,
): string {
  return new Date(
    now_milliseconds - retention_days * MILLISECONDS_PER_DAY,
  ).toISOString();
}

export async function read_prune_watermark(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
): Promise<number> {
  const watermark = await ctx.db
    .query(WATERMARK_TABLE_NAME)
    .withIndex(WATERMARK_INDEX_NAME, (range) =>
      range.eq("table_name", table_name),
    )
    .first();
  return watermark
    ? watermark.pruned_through_sequence
    : NOTHING_PRUNED_SEQUENCE;
}

export async function raise_prune_watermark(
  ctx: MutationCtx,
  table_name: string,
  pruned_through_sequence: number,
): Promise<number> {
  const watermark = await ctx.db
    .query(WATERMARK_TABLE_NAME)
    .withIndex(WATERMARK_INDEX_NAME, (range) =>
      range.eq("table_name", table_name),
    )
    .first();
  if (!watermark) {
    await ctx.db.insert(WATERMARK_TABLE_NAME, {
      table_name,
      pruned_through_sequence,
    });
    return pruned_through_sequence;
  }
  const raised = Math.max(
    watermark.pruned_through_sequence,
    pruned_through_sequence,
  );
  await ctx.db.patch(watermark._id, { pruned_through_sequence: raised });
  return raised;
}

export function is_cursor_expired(
  after_sequence: number,
  pruned_through_sequence: number,
): boolean {
  return (
    after_sequence > INITIAL_CURSOR_SEQUENCE &&
    after_sequence < pruned_through_sequence
  );
}
