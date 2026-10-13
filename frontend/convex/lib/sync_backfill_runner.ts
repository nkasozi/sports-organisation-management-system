import type { MutationCtx } from "../_generated/server";
import {
  BackfillStatus,
  type BackfillStatusValue,
  SYNC_SEQUENCE_BACKFILL_BATCH_SIZE,
  transition_backfill_state,
} from "./sync_backfill_state";
import {
  load_backfill_state,
  save_backfill_state,
} from "./sync_backfill_store";
import { create_sync_change_stamp } from "./sync_change_stamp";
import {
  ALLOWED_SYNC_TABLES,
  type AllowedSyncTable,
} from "./sync_table_catalog";

const SYNC_SEQUENCE_INDEX = "by_sync_sequence";
const SYNC_SEQUENCE_FIELD_NAME = "sync_sequence";
const NOTHING_BACKFILLED = 0;

interface TableBackfillOutcome {
  backfilled_count: number;
  status: BackfillStatusValue;
}

interface BackfillSliceSummary {
  backfilled_count: number;
  all_complete: boolean;
}

async function stamp_unsequenced_rows(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  remaining_budget: number,
): Promise<number> {
  const unsequenced_rows = await ctx.db
    .query(table_name)
    .withIndex(SYNC_SEQUENCE_INDEX, (range) =>
      range.eq(SYNC_SEQUENCE_FIELD_NAME, undefined),
    )
    .take(remaining_budget);
  for (const row of unsequenced_rows) {
    const stamp = await create_sync_change_stamp(ctx, {
      table_name,
      changed_records: [row],
    });
    await ctx.db.patch(row._id, {
      sync_sequence: stamp.sync_sequence,
    } as never);
  }
  return unsequenced_rows.length;
}

async function backfill_table(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  remaining_budget: number,
  now_iso: string,
): Promise<TableBackfillOutcome> {
  const loaded = await load_backfill_state(ctx, table_name);
  const backfilled_count = await stamp_unsequenced_rows(
    ctx,
    table_name,
    remaining_budget,
  );
  const next_state = transition_backfill_state(
    loaded.state,
    { backfilled_count, drained: backfilled_count < remaining_budget },
    now_iso,
  );
  const state_changed =
    next_state.status !== loaded.state.status ||
    backfilled_count > NOTHING_BACKFILLED;
  if (state_changed)
    await save_backfill_state(ctx, { table_name, loaded, next_state });
  return { backfilled_count, status: next_state.status };
}

export async function run_backfill_slice(
  ctx: MutationCtx,
  now_iso: string,
): Promise<BackfillSliceSummary> {
  let backfilled_count = NOTHING_BACKFILLED;
  for (const table_name of ALLOWED_SYNC_TABLES) {
    const remaining_budget =
      SYNC_SEQUENCE_BACKFILL_BATCH_SIZE - backfilled_count;
    const outcome = await backfill_table(
      ctx,
      table_name,
      remaining_budget,
      now_iso,
    );
    backfilled_count += outcome.backfilled_count;
    if (outcome.status !== BackfillStatus.COMPLETE)
      return { backfilled_count, all_complete: false };
  }
  return { backfilled_count, all_complete: true };
}
