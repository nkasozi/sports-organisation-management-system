import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  FieldDifference,
} from "$lib/infrastructure/sync/conflictTypes";

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
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "object") {
    return value
      ? JSON.stringify(
          value,
          (_key: string, current_value: unknown) => current_value,
          2,
        )
      : "null";
  }
  return String(value);
}

export function format_merge_conflict_timestamp(timestamp: string): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleString();
}

export function get_merge_conflict_selected_value_source(
  custom_merge_values: Record<string, unknown>,
  field_name: string,
  difference: FieldDifference,
): "local" | "remote" | "none" {
  if (!(field_name in custom_merge_values)) return "none";
  const selected_value = custom_merge_values[field_name];
  if (selected_value === difference.local_value) return "local";
  if (selected_value === difference.remote_value) return "remote";
  return "none";
}
