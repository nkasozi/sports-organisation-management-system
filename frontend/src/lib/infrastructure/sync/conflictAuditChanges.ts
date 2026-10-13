import type { FieldChange } from "$lib/core/entities/AuditLog";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  type ConflictRecord,
  type ConflictResolutionAction,
  ConflictResolutionActionKind,
  type FieldDifference,
} from "$lib/infrastructure/sync/conflictTypes";

const RESOLUTION_ACTION_FIELD_NAME = "resolution_action";
const RESOLUTION_SOURCE_FIELD_NAME = "resolution_source";
const CONFLICT_STATE_LABEL = "conflict";
const LOCAL_SOURCE_LABEL = "local";
const REMOTE_SOURCE_LABEL = "remote";
const OBJECT_TYPE_NAME = "object";
const UNDEFINED_VALUE_LABEL = "undefined";
const NULL_VALUE_LABEL = "null";

const RESOLUTION_DESCRIPTION: Record<ConflictResolutionAction, string> = {
  [ConflictResolutionActionKind.KEEP_LOCAL]:
    "Kept local changes (overwrote server)",
  [ConflictResolutionActionKind.KEEP_REMOTE]:
    "Kept server version (discarded local)",
  [ConflictResolutionActionKind.MERGE]:
    "Manual merge of local and remote changes",
};

export function build_conflict_changes(
  field_differences: FieldDifference[],
): FieldChange[] {
  return field_differences.map((diff) => ({
    field_name: diff.field_name,
    old_value: `Local: ${format_value_for_audit(diff.local_value)}`,
    new_value: `Remote: ${format_value_for_audit(diff.remote_value)}`,
  }));
}

function format_value_for_audit(value: unknown): string {
  if (value == void 0)
    return value === void 0 ? UNDEFINED_VALUE_LABEL : NULL_VALUE_LABEL;
  if (typeof value === OBJECT_TYPE_NAME) return JSON.stringify(value);
  return String(value);
}

function get_resolution_description(action: ConflictResolutionAction): string {
  return RESOLUTION_DESCRIPTION[action];
}

function build_merge_changes(
  conflict: ScalarInput<ConflictRecord>,
  resolved_data: Record<string, unknown>,
): FieldChange[] {
  return conflict.field_differences.map((diff) => ({
    field_name: diff.field_name,
    old_value: `Local: ${format_value_for_audit(diff.local_value)} | Remote: ${format_value_for_audit(diff.remote_value)}`,
    new_value: format_value_for_audit(resolved_data[diff.field_name]),
  }));
}

function build_resolution_detail_changes(
  conflict: ScalarInput<ConflictRecord>,
  resolution_action: ConflictResolutionAction,
  resolved_data: Record<string, unknown>,
): FieldChange[] {
  switch (resolution_action) {
    case ConflictResolutionActionKind.KEEP_LOCAL:
      return [
        {
          field_name: RESOLUTION_SOURCE_FIELD_NAME,
          old_value: REMOTE_SOURCE_LABEL,
          new_value: LOCAL_SOURCE_LABEL,
        },
      ];
    case ConflictResolutionActionKind.KEEP_REMOTE:
      return [
        {
          field_name: RESOLUTION_SOURCE_FIELD_NAME,
          old_value: LOCAL_SOURCE_LABEL,
          new_value: REMOTE_SOURCE_LABEL,
        },
      ];
    case ConflictResolutionActionKind.MERGE:
      return build_merge_changes(conflict, resolved_data);
  }
}

export function build_resolution_changes(
  conflict: ScalarInput<ConflictRecord>,
  resolution_action: ConflictResolutionAction,
  resolved_data: Record<string, unknown>,
): FieldChange[] {
  return [
    {
      field_name: RESOLUTION_ACTION_FIELD_NAME,
      old_value: CONFLICT_STATE_LABEL,
      new_value: get_resolution_description(resolution_action),
    },
    ...build_resolution_detail_changes(
      conflict,
      resolution_action,
      resolved_data,
    ),
  ];
}
