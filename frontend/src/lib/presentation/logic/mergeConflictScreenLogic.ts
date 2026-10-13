import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  FieldDifference,
} from "$lib/infrastructure/sync/conflictTypes";

import { is_absent_value, is_object_value } from "./runtimeTypeGuards";

export const MERGE_CONFLICT_VALUE_SOURCE = {
  LOCAL: "local",
  REMOTE: "remote",
  NONE: "none",
} as const;

export type MergeConflictValueSource =
  (typeof MERGE_CONFLICT_VALUE_SOURCE)[keyof typeof MERGE_CONFLICT_VALUE_SOURCE];

const UNDEFINED_VALUE_LABEL = "undefined";
const UNKNOWN_TIMESTAMP_LABEL = "Unknown";
const JSON_INDENT_SPACES = 2;

export function build_merge_conflict_resolved_data(
  conflict: ScalarInput<ConflictRecord>,
  custom_merge_values: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...conflict.local_data,
    ...custom_merge_values,
    updated_at: new Date().toISOString(),
  };
}

export function format_merge_conflict_value(value: unknown): string {
  if (is_absent_value(value)) return UNDEFINED_VALUE_LABEL;
  if (is_object_value(value)) {
    return JSON.stringify(
      value,
      (_key: string, current_value: unknown) => current_value,
      JSON_INDENT_SPACES,
    );
  }
  return String(value);
}

export function format_merge_conflict_timestamp(timestamp: string): string {
  if (!timestamp) return UNKNOWN_TIMESTAMP_LABEL;
  return new Date(timestamp).toLocaleString();
}

export function get_merge_conflict_selected_value_source(
  custom_merge_values: Record<string, unknown>,
  field_name: string,
  difference: FieldDifference,
): MergeConflictValueSource {
  if (!(field_name in custom_merge_values)) {
    return MERGE_CONFLICT_VALUE_SOURCE.NONE;
  }
  const selected_value = custom_merge_values[field_name];
  if (selected_value === difference.local_value) {
    return MERGE_CONFLICT_VALUE_SOURCE.LOCAL;
  }
  if (selected_value === difference.remote_value) {
    return MERGE_CONFLICT_VALUE_SOURCE.REMOTE;
  }
  return MERGE_CONFLICT_VALUE_SOURCE.NONE;
}
