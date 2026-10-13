import type {
  EntityId,
  IsoDateTimeString,
  Name,
} from "$lib/core/types/DomainScalars";
import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

export const ConflictResolutionActionKind = {
  KEEP_LOCAL: "keep_local",
  KEEP_REMOTE: "keep_remote",
  MERGE: "merge",
} as const;

export type ConflictResolutionAction =
  (typeof ConflictResolutionActionKind)[keyof typeof ConflictResolutionActionKind];

export const ConflictFieldValueStatus = {
  UNKNOWN: "unknown",
  KNOWN: "known",
} as const;

export type ConflictFieldValue<TValue> =
  | { status: typeof ConflictFieldValueStatus.UNKNOWN }
  | { status: typeof ConflictFieldValueStatus.KNOWN; value: TValue };

const OBJECT_TYPE_NAME = "object";
const UNKNOWN_ENTITY_ID_LABEL = "unknown";

export function create_unknown_conflict_field_value<
  TValue,
>(): ConflictFieldValue<TValue> {
  return { status: ConflictFieldValueStatus.UNKNOWN };
}

export function create_known_conflict_field_value<TValue>(
  value: TValue,
): ConflictFieldValue<TValue> {
  return { status: ConflictFieldValueStatus.KNOWN, value };
}

export interface FieldDifference {
  field_name: string;
  local_value: unknown;
  remote_value: unknown;
  display_name: string;
}

export interface ConflictRecord {
  id: string;
  table_name: string;
  local_id: EntityId;
  entity_display_name: string;
  local_data: Record<string, unknown>;
  remote_data: Record<string, unknown>;
  local_updated_at: IsoDateTimeString;
  remote_updated_at: IsoDateTimeString;
  remote_updated_by: ConflictFieldValue<EntityId>;
  remote_updated_by_name: ConflictFieldValue<Name>;
  field_differences: FieldDifference[];
  detected_at: IsoDateTimeString;
}

export interface ConflictResolution {
  conflict_id: string;
  table_name: string;
  local_id: ConflictRecord["local_id"];
  action: ConflictResolutionAction;
  resolved_at: IsoDateTimeString;
  resolved_by: ConflictFieldValue<EntityId>;
  merged_data?: Record<string, unknown>;
}

interface ConflictDetectionResult {
  has_conflicts: boolean;
  conflicts: ConflictRecord[];
  records_without_conflicts: Array<{
    local_id: ConflictRecord["local_id"];
    data: Record<string, unknown>;
    version: number;
  }>;
}

export function compute_field_differences(
  local_data: Record<string, unknown>,
  remote_data: Record<string, unknown>,
  excluded_fields: string[] = [
    "id",
    "local_id",
    "created_at",
    "updated_at",
    "synced_at",
    "version",
    "_id",
  ],
): FieldDifference[] {
  const differences: FieldDifference[] = [];
  const all_keys = new Set([
    ...Object.keys(local_data),
    ...Object.keys(remote_data),
  ]);

  for (const key of all_keys) {
    if (excluded_fields.includes(key)) continue;

    const local_value = local_data[key];
    const remote_value = remote_data[key];

    if (!values_are_equal(local_value, remote_value)) {
      differences.push({
        field_name: key,
        local_value,
        remote_value,
        display_name: format_field_name(key),
      });
    }
  }

  return differences;
}

function arrays_are_equal(a: unknown[], b: unknown[]): boolean {
  return (
    a.length === b.length &&
    a.every((value, index) => values_are_equal(value, b[index]))
  );
}

function is_present_object(value: unknown): value is Record<string, unknown> {
  return typeof value === OBJECT_TYPE_NAME && value != void 0;
}

function objects_are_equal(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const a_keys = Object.keys(a);
  return (
    a_keys.length === Object.keys(b).length &&
    a_keys.every((key) => values_are_equal(a[key], b[key]))
  );
}

function values_are_equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == void 0 && b == void 0) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) return arrays_are_equal(a, b);
  if (is_present_object(a) && is_present_object(b))
    return objects_are_equal(a, b);
  return false;
}

function format_field_name(field_name: string): string {
  return field_name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function generate_conflict_id(
  table_name: string,
  local_id: ConflictRecord["local_id"],
): string {
  return `conflict_${table_name}_${local_id}_${Date.now()}`;
}

export function get_entity_display_name(
  data: Record<string, unknown>,
  table_name: string,
): string {
  if (data.name && is_string_value(data.name)) {
    return data.name;
  }

  if (
    data.first_name &&
    data.last_name &&
    is_string_value(data.first_name) &&
    is_string_value(data.last_name)
  ) {
    return `${data.first_name} ${data.last_name}`;
  }

  if (data.title && is_string_value(data.title)) {
    return data.title;
  }

  const formatted_table = table_name
    .replace(/_/g, " ")
    .replace(/s$/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return `${formatted_table} (${data.id || UNKNOWN_ENTITY_ID_LABEL})`;
}
