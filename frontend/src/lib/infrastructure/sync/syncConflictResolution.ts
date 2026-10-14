import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { UNKNOWN_SERVER_SEQUENCE } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  classify_force_resolve_response,
  type ConflictResolutionOutcome,
  ConflictResolutionOutcomeKind,
  create_failed_resolution,
} from "./syncConflictResolutionOutcome";
import { get_database } from "./syncDataAccess";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";
import type { ConflictResolutionRequest, ConvexClient } from "./syncTypes";

const FORCE_RESOLVE_MUTATION_NAME = "sync:force_resolve_conflict";
const SERVER_ASSIGNED_VERSION_PLACEHOLDER = 0;
const KNOWN_BASE_VERSION_KIND = "known";

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

async function store_resolved_copy(
  request: ConflictResolutionRequest,
  server_version: number,
): Promise<boolean> {
  await apply_resolved_remote_record(
    { database: get_database(), gate: sync_change_tracking_gate },
    request.table_name,
    {
      local_id: request.local_id,
      server_version,
      server_sequence: UNKNOWN_SERVER_SEQUENCE,
      local_data: { ...request.resolved_data, id: request.local_id },
    },
    { kind: ResolvedRecordGuardKind.CONFLICTED_ENTRY },
  );
  return true;
}

function log_resolution_outcome(
  request: ConflictResolutionRequest,
  outcome: ConflictResolutionOutcome,
): ConflictResolutionOutcome {
  const context = {
    table_name: request.table_name,
    local_id: request.local_id,
    resolution_action: request.resolution_action,
    outcome: outcome.kind,
  };
  if (outcome.kind === ConflictResolutionOutcomeKind.RESOLVED)
    console.log("[Sync] Conflict resolved", {
      event: "sync_conflict_resolved",
      ...context,
      server_version: outcome.server_version,
    });
  else
    console.error("[Sync] Conflict resolution failed", {
      event: "sync_conflict_resolution_failed",
      ...context,
    });
  return outcome;
}

async function run_force_resolve(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): Promise<ConflictResolutionOutcome> {
  try {
    const outcome = classify_force_resolve_response(
      await convex_client.mutation(
        FORCE_RESOLVE_MUTATION_NAME,
        build_force_resolve_arguments(request),
      ),
    );
    if (outcome.kind === ConflictResolutionOutcomeKind.RESOLVED)
      await store_resolved_copy(request, outcome.server_version);
    return outcome;
  } catch (error) {
    return create_failed_resolution(
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function resolve_conflict_with_outcome(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): Promise<ConflictResolutionOutcome> {
  return log_resolution_outcome(
    request,
    await run_force_resolve(convex_client, request),
  );
}

export async function resolve_conflict(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): AsyncResult<boolean> {
  const outcome = await resolve_conflict_with_outcome(convex_client, request);
  switch (outcome.kind) {
    case ConflictResolutionOutcomeKind.RESOLVED:
      return create_success_result(true);
    case ConflictResolutionOutcomeKind.FAILED:
      return create_failure_result(outcome.error);
    case ConflictResolutionOutcomeKind.REMOTE_CHANGED_AGAIN:
    case ConflictResolutionOutcomeKind.DELETED_REMOTELY:
      return create_failure_result(outcome.kind);
  }
}
