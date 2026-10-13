import type { Infer } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { run_backfill_slice } from "./lib/sync_backfill_runner";
import {
  backfill_run_validator,
  BackfillRunKind,
  BackfillSliceStatus,
  resolve_backfill_slice_status,
} from "./lib/sync_backfill_state";

const IMMEDIATE_DELAY_MILLISECONDS = 0;
const CORRELATION_ID_PREFIX = "sync_backfill";
const FIRST_CONTINUATION_COUNT = 0;
const CONTINUATION_INCREMENT = 1;

type BackfillRun = Infer<typeof backfill_run_validator>;

interface BackfillRunContext {
  correlation_id: string;
  continuation_count: number;
}

function resolve_run_context(
  run: BackfillRun,
  started_at_milliseconds: number,
): BackfillRunContext {
  switch (run.kind) {
    case BackfillRunKind.SCHEDULED_START:
      return {
        correlation_id: `${CORRELATION_ID_PREFIX}_${started_at_milliseconds}`,
        continuation_count: FIRST_CONTINUATION_COUNT,
      };
    case BackfillRunKind.CONTINUATION:
      return {
        correlation_id: run.correlation_id,
        continuation_count: run.continuation_count,
      };
  }
}

async function schedule_backfill_continuation(
  ctx: MutationCtx,
  run_context: BackfillRunContext,
): Promise<boolean> {
  await ctx.scheduler.runAfter(
    IMMEDIATE_DELAY_MILLISECONDS,
    internal.sync.backfill_sync_sequences_batch,
    {
      run: {
        kind: BackfillRunKind.CONTINUATION,
        correlation_id: run_context.correlation_id,
        continuation_count:
          run_context.continuation_count + CONTINUATION_INCREMENT,
      },
    },
  );
  return true;
}

export const backfill_sync_sequences_batch = internalMutation({
  args: { run: backfill_run_validator },
  handler: async (ctx, args) => {
    const run_context = resolve_run_context(args.run, Date.now());
    const summary = await run_backfill_slice(ctx, new Date().toISOString());
    const status = resolve_backfill_slice_status({
      all_complete: summary.all_complete,
      continuation_count: run_context.continuation_count,
    });
    if (status === BackfillSliceStatus.CONTINUED)
      await schedule_backfill_continuation(ctx, run_context);
    console.log("[SyncBackfill] Sync sequence backfill slice finished", {
      event: "sync_sequence_backfill_slice_finished",
      correlation_id: run_context.correlation_id,
      continuation_count: run_context.continuation_count,
      backfilled_count: summary.backfilled_count,
      status,
    });
    return {
      backfilled_count: summary.backfilled_count,
      status,
      correlation_id: run_context.correlation_id,
    };
  },
});
