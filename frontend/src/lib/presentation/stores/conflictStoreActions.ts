import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  log_conflict_detected,
  log_conflict_resolution,
} from "$lib/infrastructure/sync/conflictAuditService";
import type {
  ConflictRecord,
  ConflictResolution,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  compute_field_differences,
  create_unknown_conflict_field_value,
  generate_conflict_id,
  get_entity_display_name,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictFromServer } from "$lib/infrastructure/sync/syncTypes";

import type { ConflictStoreState } from "./conflictStoreHelpers";
import { get_resolved_data_for_action } from "./conflictStoreHelpers";

export interface ConflictStoreContext {
  read_state: () => ConflictStoreState;
  update: (updater: (state: ConflictStoreState) => ConflictStoreState) => void;
}

export type ConflictResolutionResult = Result<ScalarInput<ConflictResolution>>;

function create_conflict_timestamp(): ConflictRecord["detected_at"] {
  return new Date().toISOString() as ConflictRecord["detected_at"];
}

function build_conflict_record_from_server(
  table_name: string,
  conflict: ConflictFromServer,
): ScalarInput<ConflictRecord> {
  return {
    id: generate_conflict_id(
      table_name,
      conflict.local_id as ConflictRecord["local_id"],
    ),
    table_name,
    local_id: conflict.local_id as ConflictRecord["local_id"],
    entity_display_name: get_entity_display_name(
      conflict.local_data,
      table_name,
    ),
    local_data: conflict.local_data,
    remote_data: conflict.remote_data,
    local_updated_at:
      (conflict.local_data.updated_at as ConflictRecord["local_updated_at"]) ||
      create_conflict_timestamp(),
    remote_updated_at:
      conflict.remote_updated_at as ConflictRecord["remote_updated_at"],
    remote_updated_by: conflict.remote_updated_by,
    remote_updated_by_name: create_unknown_conflict_field_value(),
    field_differences: compute_field_differences(
      conflict.local_data,
      conflict.remote_data,
    ),
    detected_at: create_conflict_timestamp(),
  };
}

function audit_detected_conflict(conflict: ScalarInput<ConflictRecord>): void {
  log_conflict_detected(conflict).catch((err) => {
    console.error("[ConflictStore] Failed to audit log conflict", {
      event: "conflict_audit_log_failed",
      error: String(err),
    });
  });
}

export function add_conflicts_from_sync_response(
  context: ConflictStoreContext,
  table_name: string,
  conflicts: ConflictFromServer[],
): boolean {
  if (conflicts.length === 0) return false;

  const new_conflicts: ScalarInput<ConflictRecord>[] = conflicts.map(
    (conflict) => build_conflict_record_from_server(table_name, conflict),
  );

  for (const conflict of new_conflicts) {
    audit_detected_conflict(conflict);
  }

  context.update((state) => ({
    ...state,
    pending_conflicts: [...state.pending_conflicts, ...new_conflicts],
    show_merge_screen: true,
  }));
  return true;
}

function audit_conflict_resolution(
  conflict: ScalarInput<ConflictRecord>,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): void {
  const resolved_data = get_resolved_data_for_action(
    conflict,
    action,
    merged_data,
  );
  log_conflict_resolution(conflict, action, resolved_data).catch((err) => {
    console.error("[ConflictStore] Failed to audit log conflict resolution", {
      event: "conflict_resolution_audit_log_failed",
      error: String(err),
    });
  });
}

export function resolve_conflict(
  context: ConflictStoreContext,
  conflict_id: string,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): ConflictResolutionResult {
  const conflict = context
    .read_state()
    .pending_conflicts.find((c) => c.id === conflict_id);
  if (!conflict)
    return create_failure_result(`Conflict not found: ${conflict_id}`);

  const resolution: ScalarInput<ConflictResolution> = {
    conflict_id,
    table_name: conflict.table_name,
    local_id: conflict.local_id,
    action,
    resolved_at: create_conflict_timestamp(),
    resolved_by: create_unknown_conflict_field_value(),
    merged_data,
  };

  audit_conflict_resolution(conflict, action, merged_data);

  context.update((state) => ({
    ...state,
    pending_conflicts: state.pending_conflicts.filter(
      (c) => c.id !== conflict_id,
    ),
    resolved_conflicts: [...state.resolved_conflicts, resolution],
  }));
  return create_success_result(resolution);
}

export function resolve_current_conflict(
  context: ConflictStoreContext,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): ConflictResolutionResult {
  const current_state = context.read_state();
  const current_conflict =
    current_state.pending_conflicts[current_state.current_conflict_index];
  if (!current_conflict)
    return create_failure_result("No current conflict to resolve");
  return resolve_conflict(context, current_conflict.id, action, merged_data);
}
