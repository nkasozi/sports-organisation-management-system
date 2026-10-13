import type {
  RemoteChangeSubscriberPort,
  SyncOrchestratorPort,
  SyncRestorationHandlers,
} from "$lib/core/interfaces/ports";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";

import {
  SYNC_RETRY_BASE_DELAY_MS,
  SyncRetryReason,
  type SyncRetryReasonValue,
  SyncRunKind,
  type SyncRunKindValue,
} from "./syncEngineTypes";
import { SYNC_ALREADY_IN_PROGRESS_ERROR } from "./syncRunSignals";

export type ConfiguredDependencyState<TDependency> =
  | { status: "unconfigured" }
  | { status: "configured"; value: TDependency };

export const DependencyStatus = {
  UNCONFIGURED: "unconfigured",
  CONFIGURED: "configured",
} as const;

export interface SyncEngineConfiguration {
  orchestrator: ConfiguredDependencyState<SyncOrchestratorPort>;
  restoration_handlers: ConfiguredDependencyState<SyncRestorationHandlers>;
  remote_subscriber: ConfiguredDependencyState<RemoteChangeSubscriberPort>;
}

export const SyncRunOutcome = {
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  SKIPPED: "skipped",
  DEFERRED: "deferred",
} as const;

export type SyncRunReport =
  | { outcome: typeof SyncRunOutcome.SUCCEEDED }
  | { outcome: typeof SyncRunOutcome.FAILED }
  | { outcome: typeof SyncRunOutcome.SKIPPED }
  | {
      outcome: typeof SyncRunOutcome.DEFERRED;
      reason: SyncRetryReasonValue;
      retry_after_milliseconds: number;
    };

interface ExecuteSyncRunCommand {
  run_id: string;
  run_kind: SyncRunKindValue;
  configuration: SyncEngineConfiguration;
  is_signed_in: boolean;
  take_backfill_retry_after(): Option<number>;
}

const PUSH_DIRECTION = "push";
const BIDIRECTIONAL_DIRECTION = "bidirectional";
const ANOTHER_RUN_RETRY_DELAY_MS = SYNC_RETRY_BASE_DELAY_MS;

async function run_orchestrator(
  orchestrator: SyncOrchestratorPort,
  command: ExecuteSyncRunCommand,
): Promise<Result<unknown, unknown>> {
  return command.run_kind === SyncRunKind.PUSH
    ? orchestrator.sync_now(PUSH_DIRECTION)
    : orchestrator.sync_now(BIDIRECTIONAL_DIRECTION, {
        use_fresh_timestamps: true,
      });
}

function is_already_running_failure(error: unknown): boolean {
  return (
    error instanceof Object &&
    (error as { message?: unknown }).message === SYNC_ALREADY_IN_PROGRESS_ERROR
  );
}

function classify_orchestrator_result(
  result: Result<unknown, unknown>,
  backfill_retry_after: Option<number>,
): SyncRunReport {
  if (!result.success)
    return is_already_running_failure(result.error)
      ? {
          outcome: SyncRunOutcome.DEFERRED,
          reason: SyncRetryReason.ANOTHER_SYNC_RUNNING,
          retry_after_milliseconds: ANOTHER_RUN_RETRY_DELAY_MS,
        }
      : { outcome: SyncRunOutcome.FAILED };
  return backfill_retry_after.status === OptionStatus.SOME
    ? {
        outcome: SyncRunOutcome.DEFERRED,
        reason: SyncRetryReason.SERVER_BACKFILL,
        retry_after_milliseconds: backfill_retry_after.value,
      }
    : { outcome: SyncRunOutcome.SUCCEEDED };
}

function skip_run(event: string, log_context: object): SyncRunReport {
  console.log("[SyncEngine] Run skipped", { event, ...log_context });
  return { outcome: SyncRunOutcome.SKIPPED };
}

export async function execute_sync_run(
  command: ExecuteSyncRunCommand,
): Promise<SyncRunReport> {
  const log_context = { run_id: command.run_id, run_kind: command.run_kind };
  if (!command.is_signed_in)
    return skip_run("sync_engine_run_skipped_signed_out", log_context);
  const orchestrator = command.configuration.orchestrator;
  if (orchestrator.status !== DependencyStatus.CONFIGURED)
    return skip_run("sync_engine_run_skipped_unconfigured", log_context);
  try {
    const result = await run_orchestrator(orchestrator.value, command);
    const report = classify_orchestrator_result(
      result,
      command.take_backfill_retry_after(),
    );
    console.log("[SyncEngine] Run finished", {
      event: "sync_engine_run_finished",
      ...log_context,
      outcome: report.outcome,
    });
    return report;
  } catch (error) {
    console.error("[SyncEngine] Run threw unexpectedly", {
      event: "sync_engine_run_threw",
      ...log_context,
      error: String(error),
    });
    return { outcome: SyncRunOutcome.FAILED };
  }
}
