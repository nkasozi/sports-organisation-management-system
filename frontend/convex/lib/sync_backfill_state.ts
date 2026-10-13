import { v } from "convex/values";

export const SYNC_SEQUENCE_BACKFILL_BATCH_SIZE = 200;
const MAX_SYNC_SEQUENCE_BACKFILL_CONTINUATIONS = 1000;

export const BackfillStatus = {
  NOT_STARTED: "not_started",
  RUNNING: "running",
  COMPLETE: "complete",
} as const;

export type BackfillStatusValue =
  (typeof BackfillStatus)[keyof typeof BackfillStatus];

export const BackfillSliceStatus = {
  COMPLETE: "complete",
  CONTINUED: "continued",
  CONTINUATION_LIMIT_REACHED: "continuation_limit_reached",
} as const;

type BackfillSliceStatusValue =
  (typeof BackfillSliceStatus)[keyof typeof BackfillSliceStatus];

export interface BackfillTableState {
  status: BackfillStatusValue;
  backfilled_count: number;
  updated_at: string;
}

type StoredBackfillStatusValue =
  | typeof BackfillStatus.RUNNING
  | typeof BackfillStatus.COMPLETE;

export interface StoredBackfillTableState extends BackfillTableState {
  status: StoredBackfillStatusValue;
}

interface BackfillTableScan {
  backfilled_count: number;
  drained: boolean;
}

export const BackfillRunKind = {
  SCHEDULED_START: "scheduled_start",
  CONTINUATION: "continuation",
} as const;

export const backfill_run_validator = v.union(
  v.object({ kind: v.literal(BackfillRunKind.SCHEDULED_START) }),
  v.object({
    kind: v.literal(BackfillRunKind.CONTINUATION),
    correlation_id: v.string(),
    continuation_count: v.number(),
  }),
);

export const stored_backfill_status_validator = v.union(
  v.literal(BackfillStatus.RUNNING),
  v.literal(BackfillStatus.COMPLETE),
);

const NEVER_UPDATED = "";

export const NOT_STARTED_BACKFILL_STATE: BackfillTableState = {
  status: BackfillStatus.NOT_STARTED,
  backfilled_count: 0,
  updated_at: NEVER_UPDATED,
};

export function transition_backfill_state(
  state: BackfillTableState,
  scan: BackfillTableScan,
  now_iso: string,
): StoredBackfillTableState {
  return {
    status: scan.drained ? BackfillStatus.COMPLETE : BackfillStatus.RUNNING,
    backfilled_count: state.backfilled_count + scan.backfilled_count,
    updated_at: now_iso,
  };
}

export function resolve_backfill_slice_status(command: {
  all_complete: boolean;
  continuation_count: number;
}): BackfillSliceStatusValue {
  if (command.all_complete) return BackfillSliceStatus.COMPLETE;
  return command.continuation_count < MAX_SYNC_SEQUENCE_BACKFILL_CONTINUATIONS
    ? BackfillSliceStatus.CONTINUED
    : BackfillSliceStatus.CONTINUATION_LIMIT_REACHED;
}
