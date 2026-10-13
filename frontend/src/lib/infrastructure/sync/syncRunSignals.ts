import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

export const SYNC_ALREADY_IN_PROGRESS_ERROR = "Sync already in progress";
export const SYNC_RUN_CANCELLED_ERROR = "Sync run cancelled";

interface SyncRunCancellation {
  current_epoch(): number;
  cancel_active_runs(): number;
  is_cancelled(started_epoch: number): boolean;
}

export interface SyncBackfillDeferrals {
  record(table_name: string, retry_after_milliseconds: number): boolean;
  take_longest_retry_after(): Option<number>;
}

export function create_sync_run_cancellation(): SyncRunCancellation {
  let epoch = 0;
  return {
    current_epoch: (): number => epoch,
    cancel_active_runs: (): number => {
      epoch += 1;
      return epoch;
    },
    is_cancelled: (started_epoch: number): boolean => started_epoch !== epoch,
  };
}

export function create_sync_backfill_deferrals(): SyncBackfillDeferrals {
  let pending_retries = new Map<string, number>();
  return {
    record: (table_name: string, retry_after_milliseconds: number): boolean => {
      pending_retries.set(table_name, retry_after_milliseconds);
      return true;
    },
    take_longest_retry_after: (): Option<number> => {
      const retries = [...pending_retries.values()];
      pending_retries = new Map();
      return retries.length > 0
        ? create_some_option(Math.max(...retries))
        : create_none_option();
    },
  };
}

export const sync_run_cancellation = create_sync_run_cancellation();
export const sync_backfill_deferrals = create_sync_backfill_deferrals();
