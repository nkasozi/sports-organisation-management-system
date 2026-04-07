import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import {
  extract_entity_type_from_name_column,
  is_id_column,
  is_name_column,
  looks_like_entity_name,
  resolve_entity_name_to_id,
} from "$lib/core/services/nameResolutionService";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import { convert_bulk_import_record_to_entity_input } from "$lib/presentation/logic/bulkImportCsv";
import type {
  BulkImportNameColumn,
  BulkImportNameResolutionError,
} from "$lib/presentation/logic/bulkImportTypes";

export function find_bulk_import_name_columns(
  foreign_key_fields: FieldMetadata[],
  record: Record<string, string>,
): BulkImportNameColumn[] {
  const name_columns: BulkImportNameColumn[] = [];
  for (const column_name of Object.keys(record)) {
    if (is_name_column(column_name)) {
      const potential_entity_type =
        extract_entity_type_from_name_column(column_name);
      const matching_foreign_key_field = foreign_key_fields.find(
        (field: FieldMetadata) =>
          field.foreign_key_entity?.toLowerCase() ===
          potential_entity_type.toLowerCase(),
      );
      if (matching_foreign_key_field) {
        name_columns.push({
          entity_type: potential_entity_type,
          id_column: matching_foreign_key_field.field_name,
          name_column: column_name,
        });
      }
      continue;
    }
    if (
      !is_id_column(column_name) ||
      !looks_like_entity_name(record[column_name])
    )
      continue;
    const matching_foreign_key_field = foreign_key_fields.find(
      (field: FieldMetadata) => field.field_name === column_name,
    );
    if (!matching_foreign_key_field?.foreign_key_entity) continue;
    name_columns.push({
      entity_type: matching_foreign_key_field.foreign_key_entity.toLowerCase(),
      id_column: column_name,
      name_column: column_name,
    });
  }
  return name_columns;
}

async function resolve_bulk_import_name_columns(
  name_columns: BulkImportNameColumn[],
  record: Record<string, string>,
): Promise<{
  errors: BulkImportNameResolutionError[];
  resolved_values: Record<string, string>;
}> {
  const errors: BulkImportNameResolutionError[] = [];
  const resolved_values: Record<string, string> = {};
  for (const name_column of name_columns) {
    const name_value = record[name_column.name_column];
    if (!name_value?.trim()) continue;
    const name_resolver_result = get_use_cases_for_entity_type(
      name_column.entity_type.toLowerCase(),
    );
    if (!name_resolver_result.success) {
      errors.push({
        column_name: name_column.name_column,
        error_message: `Error: Unknown entity type "${name_column.entity_type}". Cause: Cannot resolve name for this entity type. Solution: Use the ID column (${name_column.id_column}) instead.`,
      });
      continue;
    }
    const resolution_result = await resolve_entity_name_to_id({
      entity_name: name_value,
      entity_type: name_column.entity_type,
      use_cases: name_resolver_result.data,
    });
    if (resolution_result.success && resolution_result.resolved_id) {
      resolved_values[name_column.id_column] = resolution_result.resolved_id;
      continue;
    }
    errors.push({
      column_name: name_column.name_column,
      error_message:
        resolution_result.error_message || "Unknown resolution error",
    });
  }
  return { errors, resolved_values };
}

export async function convert_bulk_import_record_with_name_resolution(
  foreign_key_fields: FieldMetadata[],
  importable_fields: FieldMetadata[],
  record: Record<string, string>,
): Promise<{
  entity_input: Record<string, unknown>;
  errors: BulkImportNameResolutionError[];
  name_columns: BulkImportNameColumn[];
}> {
  const name_columns = find_bulk_import_name_columns(
    foreign_key_fields,
    record,
  );
  if (name_columns.length === 0) {
    return {
      entity_input: convert_bulk_import_record_to_entity_input(
        importable_fields,
        record,
      ),
      errors: [],
      name_columns,
    };
  }
  const resolution_result = await resolve_bulk_import_name_columns(
    name_columns,
    record,
  );
  if (resolution_result.errors.length > 0) {
    return { entity_input: {}, errors: resolution_result.errors, name_columns };
  }
  return {
    entity_input: convert_bulk_import_record_to_entity_input(
      importable_fields,
      { ...record, ...resolution_result.resolved_values },
    ),
    errors: [],
    name_columns,
  };
}

export function validate_bulk_import_required_fields(
  importable_fields: FieldMetadata[],
  record: Record<string, string>,
  entity_input: Record<string, unknown>,
  name_columns: BulkImportNameColumn[],
): string[] {
  const resolved_values = name_columns.reduce(
    (values: Record<string, string>, name_column: BulkImportNameColumn) => {
      const resolved_value = entity_input[name_column.id_column];
      if (resolved_value !== undefined && resolved_value !== null)
        values[name_column.id_column] = String(resolved_value);
      return values;
    },
    {},
  );
  return importable_fields.reduce(
    (missing_fields: string[], field: FieldMetadata) => {
      if (!field.is_required) return missing_fields;
      const raw_value = { ...record, ...resolved_values }[field.field_name];
      if (
        raw_value === undefined ||
        raw_value === null ||
        raw_value.trim() === ""
      )
        missing_fields.push(field.display_name);
      return missing_fields;
    },
    [],
  );
}
