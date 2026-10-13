import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  is_number_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

import type { ConvexClient } from "./syncTypes";

export const CLEAR_JOB_MAX_POLL_ATTEMPTS = 120;
const CLEAR_JOB_POLL_INTERVAL_MS = 500;
const CLEAR_ALL_DEMO_DATA_MUTATION = "sync:clear_all_demo_data";
const CLEAR_JOB_STATUS_QUERY = "sync:get_clear_job_status";
const CLEAR_TIMED_OUT_ERROR = "Server clear job did not finish in time";
const CLEAR_FAILED_ERROR = "Server clear job failed";
const INVALID_RESPONSE_ERROR = "Invalid clear response";

const RemoteClearJobStatus = {
  RUNNING: "running",
  COMPLETED: "completed",
} as const;

interface RemoteDemoClearCommand {
  convex_client: ConvexClient;
  delay(milliseconds: number): Promise<unknown>;
}

interface ClearJobProgress {
  status: string;
  deleted_count: number;
}

function read_progress(response: unknown): ClearJobProgress {
  const record = (response ?? {}) as Record<string, unknown>;
  return {
    status: is_string_value(record.status) ? record.status : "",
    deleted_count: is_number_value(record.deleted_count)
      ? record.deleted_count
      : 0,
  };
}

async function wait_for_clear_job(
  command: RemoteDemoClearCommand,
  job_id: string,
): AsyncResult<{ deleted_count: number }> {
  for (let attempt = 0; attempt < CLEAR_JOB_MAX_POLL_ATTEMPTS; attempt++) {
    await command.delay(CLEAR_JOB_POLL_INTERVAL_MS);
    const progress = read_progress(
      await command.convex_client.query(CLEAR_JOB_STATUS_QUERY, { job_id }),
    );
    switch (progress.status) {
      case RemoteClearJobStatus.COMPLETED:
        return create_success_result({ deleted_count: progress.deleted_count });
      case RemoteClearJobStatus.RUNNING:
        continue;
      default:
        console.error("[Sync:Reset] Server clear job did not complete", {
          event: "sync_remote_clear_job_failed",
          correlation_id: job_id,
          status: progress.status,
        });
        return create_failure_result(CLEAR_FAILED_ERROR);
    }
  }
  console.error("[Sync:Reset] Server clear job timed out", {
    event: "sync_remote_clear_job_timed_out",
    correlation_id: job_id,
  });
  return create_failure_result(CLEAR_TIMED_OUT_ERROR);
}

async function start_and_await_remote_clear(
  command: RemoteDemoClearCommand,
): AsyncResult<{ deleted_count: number }> {
  const response = (await command.convex_client.mutation(
    CLEAR_ALL_DEMO_DATA_MUTATION,
    {},
  )) as Record<string, unknown>;
  if (response?.success !== true)
    return create_failure_result(
      is_string_value(response?.error) && response.error
        ? response.error
        : INVALID_RESPONSE_ERROR,
    );
  const started = read_progress({ ...response, status: response.job_status });
  switch (started.status) {
    case RemoteClearJobStatus.RUNNING:
      return wait_for_clear_job(command, String(response.job_id));
    case RemoteClearJobStatus.COMPLETED:
      return create_success_result({ deleted_count: started.deleted_count });
    default:
      return create_failure_result(CLEAR_FAILED_ERROR);
  }
}

export async function run_remote_demo_data_clear(
  command: RemoteDemoClearCommand,
): AsyncResult<{ deleted_count: number }> {
  try {
    return await start_and_await_remote_clear(command);
  } catch (error) {
    console.error("[Sync:Reset] Server clear request failed", {
      event: "sync_remote_clear_request_failed",
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
