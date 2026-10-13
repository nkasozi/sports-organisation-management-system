import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import type { RejectedOutboxRecord } from "./syncPushOutcomes";
import type { RemoteApplyDependencies } from "./syncRemoteApply";
import type { ConflictFromServer, ConvexClient, TableName } from "./syncTypes";

const UNKNOWN_SERVER_ERROR = "unknown";
const BATCH_REJECTED_PREFIX = "Server rejected batch";

export interface PushTableOutboxCommand extends RemoteApplyDependencies {
  convex_client: ConvexClient;
  table_name: TableName;
  detect_conflicts: boolean;
  correlation_id: string;
}

export interface DeletedRemotelyRecord {
  table_name: string;
  local_id: string;
  local_data: Record<string, unknown>;
  tombstone_version: number;
  deleted_at: string;
}

export interface PushTableOutboxSummary {
  records_pushed: number;
  conflicts: ConflictFromServer[];
  rejected: RejectedOutboxRecord[];
  deleted_remotely: DeletedRemotelyRecord[];
}

export function create_empty_push_summary(): PushTableOutboxSummary {
  return {
    records_pushed: 0,
    conflicts: [],
    rejected: [],
    deleted_remotely: [],
  };
}

export function merge_push_summaries(
  first: PushTableOutboxSummary,
  second: PushTableOutboxSummary,
): PushTableOutboxSummary {
  return {
    records_pushed: first.records_pushed + second.records_pushed,
    conflicts: [...first.conflicts, ...second.conflicts],
    rejected: [...first.rejected, ...second.rejected],
    deleted_remotely: [...first.deleted_remotely, ...second.deleted_remotely],
  };
}

function describe_batch_failure(response: Record<string, unknown>): string {
  const error = is_string_value(response.error) ? response.error : "";
  const message = is_string_value(response.message)
    ? response.message
    : UNKNOWN_SERVER_ERROR;
  return error
    ? `${error}: ${message}`
    : `${BATCH_REJECTED_PREFIX}: ${message}`;
}

export async function send_sync_mutation<TResponse>(
  command: PushTableOutboxCommand,
  mutation_name: string,
  mutation_arguments: Record<string, unknown>,
): AsyncResult<TResponse> {
  try {
    const response = (await command.convex_client.mutation(
      mutation_name,
      mutation_arguments,
    )) as Record<string, unknown>;
    if (
      response &&
      response.success === true &&
      Array.isArray(response.results)
    )
      return create_success_result(response as unknown as TResponse);
    const failure_message = describe_batch_failure(response ?? {});
    console.error("[Sync:Push] Batch rejected by server", {
      event: "sync_push_batch_rejected",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      mutation_name,
      error: failure_message,
    });
    return create_failure_result(failure_message);
  } catch (error) {
    console.error("[Sync:Push] Batch mutation failed", {
      event: "sync_push_batch_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      mutation_name,
      error: String(error),
    });
    return create_failure_result(
      error instanceof Error ? error.message : String(error),
    );
  }
}
