import type { GenericId } from "convex/values";

import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  type BackfillStatusValue,
  type BackfillTableState,
  NOT_STARTED_BACKFILL_STATE,
  type StoredBackfillTableState,
} from "./sync_backfill_state";

const BACKFILL_STATE_TABLE_NAME = "sync_sequence_backfill_states";
const BACKFILL_STATE_INDEX_NAME = "by_table";

type BackfillStateId = GenericId<"sync_sequence_backfill_states">;

interface LoadedBackfillState {
  document_id: Option<BackfillStateId>;
  state: BackfillTableState;
}

export async function load_backfill_state(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
): Promise<LoadedBackfillState> {
  const stored = await ctx.db
    .query(BACKFILL_STATE_TABLE_NAME)
    .withIndex(BACKFILL_STATE_INDEX_NAME, (range) =>
      range.eq("table_name", table_name),
    )
    .first();
  return stored
    ? {
        document_id: create_some_option(stored._id),
        state: {
          status: stored.status,
          backfilled_count: stored.backfilled_count,
          updated_at: stored.updated_at,
        },
      }
    : { document_id: create_none_option(), state: NOT_STARTED_BACKFILL_STATE };
}

export async function read_table_backfill_status(
  ctx: { db: QueryCtx["db"] },
  table_name: string,
): Promise<BackfillStatusValue> {
  return (await load_backfill_state(ctx, table_name)).state.status;
}

export async function save_backfill_state(
  ctx: MutationCtx,
  command: {
    table_name: string;
    loaded: LoadedBackfillState;
    next_state: StoredBackfillTableState;
  },
): Promise<boolean> {
  const fields = { table_name: command.table_name, ...command.next_state };
  if (command.loaded.document_id.status === OptionStatus.SOME) {
    await ctx.db.patch(command.loaded.document_id.value, fields);
    return true;
  }
  await ctx.db.insert(BACKFILL_STATE_TABLE_NAME, fields);
  return true;
}
