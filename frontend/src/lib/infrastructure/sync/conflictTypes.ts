import type {
  EntityId,
  IsoDateTimeString,
  Name,
} from "$lib/core/types/DomainScalars";

export type ConflictResolutionAction = "keep_local" | "keep_remote" | "merge";

export type ConflictFieldValue<TValue> =
  | { status: "unknown" }
  | { status: "known"; value: TValue };

export function create_unknown_conflict_field_value<
  TValue,
>(): ConflictFieldValue<TValue> {
  return { status: "unknown" };
}

export function create_known_conflict_field_value<TValue>(
  value: TValue,
): ConflictFieldValue<TValue> {
  return { status: "known", value };
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

function values_are_equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == void 0 && b == void 0) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => values_are_equal(val, b[idx]));
  }

  if (typeof a === "object" && a != void 0 && b != void 0) {
    const a_keys = Object.keys(a as object);
    const b_keys = Object.keys(b as object);
    if (a_keys.length !== b_keys.length) return false;
    return a_keys.every((key) =>
      values_are_equal(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

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
  if (data.name && typeof data.name === "string") {
    return data.name;
  }

  if (
    data.first_name &&
    data.last_name &&
    typeof data.first_name === "string" &&
    typeof data.last_name === "string"
  ) {
    return `${data.first_name} ${data.last_name}`;
  }

  if (data.title && typeof data.title === "string") {
    return data.title;
  }

  const formatted_table = table_name
    .replace(/_/g, " ")
    .replace(/s$/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return `${formatted_table} (${data.id || "unknown"})`;
}
