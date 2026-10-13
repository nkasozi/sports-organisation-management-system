export const BackfillPullStatus = {
  COMPLETE: "complete",
  IN_PROGRESS: "in_progress",
} as const;

export type BackfillPullState =
  | { status: typeof BackfillPullStatus.COMPLETE }
  | {
      status: typeof BackfillPullStatus.IN_PROGRESS;
      retry_after_milliseconds: number;
    };

export interface TablePullSummary {
  records_pulled: number;
  backfill: BackfillPullState;
}

export function create_completed_pull(
  records_pulled: number,
): TablePullSummary {
  return { records_pulled, backfill: { status: BackfillPullStatus.COMPLETE } };
}

export function create_backfill_pending_pull(
  records_pulled: number,
  retry_after_milliseconds: number,
): TablePullSummary {
  return {
    records_pulled,
    backfill: {
      status: BackfillPullStatus.IN_PROGRESS,
      retry_after_milliseconds,
    },
  };
}
