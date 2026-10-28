import schema from "../schema";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { is_object_record } from "./value_guards";

const BLANK_FORM_VALUE = "";
const OPTIONAL_FIELD_MARKER = "optional";
const NUMBER_VALIDATOR_KINDS = new Set(["float64", "int64"]);

function read_optional_number_field_names(
  table_name: AllowedSyncTable,
): ReadonlySet<string> {
  const validator: unknown = schema.tables[table_name].validator;
  const fields = is_object_record(validator) ? validator.fields : {};
  if (!is_object_record(fields)) return new Set();
  return new Set(
    Object.entries(fields)
      .filter(
        ([, field_validator]) =>
          is_object_record(field_validator) &&
          field_validator.isOptional === OPTIONAL_FIELD_MARKER &&
          NUMBER_VALIDATOR_KINDS.has(String(field_validator.kind)),
      )
      .map(([field_name]) => field_name),
  );
}

export function omit_blank_optional_numbers(
  table_name: AllowedSyncTable,
  record_data: Record<string, unknown>,
): Record<string, unknown> {
  const optional_number_fields = read_optional_number_field_names(table_name);
  return Object.fromEntries(
    Object.entries(record_data).filter(
      ([field_name, value]) =>
        !(value === BLANK_FORM_VALUE && optional_number_fields.has(field_name)),
    ),
  );
}
