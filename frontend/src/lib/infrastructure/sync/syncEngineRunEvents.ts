import { SyncRunOutcome, type SyncRunReport } from "./syncEngineRunExecutor";
import type { SyncEngineRuntimeContext } from "./syncEngineRuntimeTypes";
import { type SyncEngineEvent, SyncEngineEventType } from "./syncEngineTypes";

export function build_run_completion_event(
  context: SyncEngineRuntimeContext,
  run_id: string,
  report: SyncRunReport,
): SyncEngineEvent {
  switch (report.outcome) {
    case SyncRunOutcome.SUCCEEDED:
      return {
        type: SyncEngineEventType.RUN_SUCCEEDED,
        run_id,
        next_run_id: context.dependencies.generate_run_id(),
      };
    case SyncRunOutcome.FAILED:
      return {
        type: SyncEngineEventType.RUN_FAILED,
        run_id,
        now: context.dependencies.now(),
      };
    case SyncRunOutcome.SKIPPED:
      return { type: SyncEngineEventType.RUN_SKIPPED, run_id };
    case SyncRunOutcome.DEFERRED:
      return {
        type: SyncEngineEventType.RUN_DEFERRED,
        run_id,
        reason: report.reason,
        retry_at: context.dependencies.now() + report.retry_after_milliseconds,
      };
  }
}
