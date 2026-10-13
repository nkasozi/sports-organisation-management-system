import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  is_number_value,
  is_record_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

import { get_database } from "./syncDataAccess";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";
import type { ConflictResolutionRequest, ConvexClient } from "./syncTypes";

const FORCE_RESOLVE_MUTATION_NAME = "sync:force_resolve_conflict";
const SERVER_ASSIGNED_VERSION_PLACEHOLDER = 0;
const KNOWN_BASE_VERSION_KIND = "known";
const RESOLUTION_REJECTED_MESSAGE = "Conflict resolution rejected by server";
const MISSING_SERVER_VERSION_MESSAGE =
  "Server accepted the resolution but did not return the new record version";

function read_server_version(response: unknown): Result<number> {
  const record: Record<string, unknown> = is_record_value(response)
    ? response
    : {};
  if (record.success !== true)
    return create_failure_result(
      is_string_value(record.error) && record.error
        ? record.error
        : RESOLUTION_REJECTED_MESSAGE,
    );
  return is_number_value(record.server_version)
    ? create_success_result(record.server_version)
    : create_failure_result(MISSING_SERVER_VERSION_MESSAGE);
}

function build_force_resolve_arguments(
  request: ConflictResolutionRequest,
): Record<string, unknown> {
  return {
    table_name: request.table_name,
    local_id: request.local_id,
    resolved_data: request.resolved_data,
    new_version: SERVER_ASSIGNED_VERSION_PLACEHOLDER,
    base_version: {
      kind: KNOWN_BASE_VERSION_KIND,
      version: request.base_version,
    },
    resolution_action: request.resolution_action,
    ...(request.resolved_by ? { resolved_by: request.resolved_by } : {}),
  };
}

export async function resolve_conflict(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): AsyncResult<boolean> {
  try {
    const response = await convex_client.mutation(
      FORCE_RESOLVE_MUTATION_NAME,
      build_force_resolve_arguments(request),
    );
    const server_version = read_server_version(response);
    if (!server_version.success) return server_version;
    await apply_resolved_remote_record(
      { database: get_database(), gate: sync_change_tracking_gate },
      request.table_name,
      {
        local_id: request.local_id,
        server_version: server_version.data,
        local_data: { ...request.resolved_data, id: request.local_id },
      },
      { kind: ResolvedRecordGuardKind.CONFLICTED_ENTRY },
    );
    console.log("[Sync] Conflict resolved", {
      event: "sync_conflict_resolved",
      table_name: request.table_name,
      local_id: request.local_id,
      resolution_action: request.resolution_action,
      server_version: server_version.data,
    });
    return create_success_result(true);
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync] Conflict resolution failed", {
      event: "sync_conflict_resolution_failed",
      table_name: request.table_name,
      error: error_message,
    });
    return create_failure_result(error_message);
  }
}
