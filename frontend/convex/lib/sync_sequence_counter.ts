import type { MutationCtx, QueryCtx } from "../_generated/server";

const SEQUENCE_TABLE_NAME = "sync_change_sequences";
const SEQUENCE_ALLOCATION_TOPOLOGY = "one_counter_document_per_table";
const SEQUENCE_INDEX_NAME = "by_table";
const INITIAL_SEQUENCE = 0;
const SEQUENCE_INCREMENT = 1;

export async function allocate_serialized_table_sync_sequence(
  ctx: MutationCtx,
  table_name: string,
): Promise<number> {
  const counter = await ctx.db
    .query(SEQUENCE_TABLE_NAME)
    .withIndex(SEQUENCE_INDEX_NAME, (query) =>
      query.eq("table_name", table_name),
    )
    .first();
  if (!counter) {
    console.log("[SyncSequence] Counter document created", {
      event: "sync_sequence_counter_created",
      correlation_id: table_name,
      topology: SEQUENCE_ALLOCATION_TOPOLOGY,
    });
    await ctx.db.insert(SEQUENCE_TABLE_NAME, {
      table_name,
      last_sequence: INITIAL_SEQUENCE + SEQUENCE_INCREMENT,
    });
    return INITIAL_SEQUENCE + SEQUENCE_INCREMENT;
  }
  const next_sequence = counter.last_sequence + SEQUENCE_INCREMENT;
  await ctx.db.patch(counter._id, { last_sequence: next_sequence });
  return next_sequence;
}

export async function read_latest_sync_sequence(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
): Promise<number> {
  const counter = await ctx.db
    .query(SEQUENCE_TABLE_NAME)
    .withIndex(SEQUENCE_INDEX_NAME, (query) =>
      query.eq("table_name", table_name),
    )
    .first();
  return counter ? counter.last_sequence : INITIAL_SEQUENCE;
}
