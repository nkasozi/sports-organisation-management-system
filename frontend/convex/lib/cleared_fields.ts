import schema from "../schema";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { is_object_record } from "./value_guards";

const PROTECTED_FIELD_NAMES = new Set<string>([
  "id",
  "local_id",
  "_id",
  "_creationTime",
  "version",
  "sync_sequence",
  "synced_at",
  "created_at",
]);
const CLEARED_FIELD_VALUE = undefined;
const CLEARED_FIELDS_IGNORED_EVENT = "sync_cleared_fields_ignored";

function read_table_field_names(
  table_name: AllowedSyncTable,
): ReadonlySet<string> {
  const validator: unknown = schema.tables[table_name].validator;
  const fields = is_object_record(validator) ? validator.fields : {};
  return new Set(is_object_record(fields) ? Object.keys(fields) : []);
}

export function select_clearable_fields(
  table_name: AllowedSyncTable,
  requested_fields: readonly string[],
): string[] {
  const table_field_names = read_table_field_names(table_name);
  const clearable = requested_fields.filter(
    (field_name) =>
      table_field_names.has(field_name) &&
      !PROTECTED_FIELD_NAMES.has(field_name),
  );
  if (clearable.length !== requested_fields.length)
    console.warn("[SyncClearedFields] Cleared fields ignored", {
      event: CLEARED_FIELDS_IGNORED_EVENT,
      table_name,
      ignored_count: requested_fields.length - clearable.length,
    });
  return clearable;
}

export function apply_cleared_fields(
  record_data: Record<string, unknown>,
  cleared_fields: readonly string[],
): Record<string, unknown> {
  return {
    ...record_data,
    ...Object.fromEntries(
      cleared_fields.map((field_name) => [field_name, CLEARED_FIELD_VALUE]),
    ),
  };
}

export function omit_cleared_values(
  record_data: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record_data).filter(
      ([, field_value]) => field_value !== CLEARED_FIELD_VALUE,
    ),
  );
}
