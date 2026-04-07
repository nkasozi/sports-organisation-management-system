import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import {
  convert_bulk_import_record_to_entity_input,
  parse_bulk_import_csv_content,
} from "$lib/presentation/logic/bulkImportCsv";
import {
  convert_bulk_import_record_with_name_resolution,
  find_bulk_import_name_columns,
  validate_bulk_import_required_fields,
} from "$lib/presentation/logic/bulkImportNameResolution";
import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

export async function execute_bulk_import(command: {
  entity_type: string;
  file_content: string;
  foreign_key_fields: FieldMetadata[];
  importable_fields: FieldMetadata[];
}): Promise<{
  failure_count: number;
  import_results: BulkImportResult[];
  success_count: number;
}> {
  const records = parse_bulk_import_csv_content(command.file_content);
  const import_use_cases_result = get_use_cases_for_entity_type(
    command.entity_type.toLowerCase(),
  );
  if (!import_use_cases_result.success) {
    return {
      failure_count: 1,
      import_results: [
        {
          error_message: `No use cases found for entity type: ${command.entity_type}`,
          original_data: {},
          row_number: 0,
          success: false,
        },
      ],
      success_count: 0,
    };
  }
  const first_record = records[0];
  const name_columns = first_record
    ? find_bulk_import_name_columns(command.foreign_key_fields, first_record)
    : [];
  const use_cases = import_use_cases_result.data;
  let failure_count = 0;
  let success_count = 0;
  const import_results: BulkImportResult[] = [];
  for (const [index, record] of records.entries()) {
    const row_number = index + 2;
    const conversion_result =
      name_columns.length > 0
        ? await convert_bulk_import_record_with_name_resolution(
            command.foreign_key_fields,
            command.importable_fields,
            record,
          )
        : {
            entity_input: convert_bulk_import_record_to_entity_input(
              command.importable_fields,
              record,
            ),
            errors: [],
            name_columns,
          };
    if (conversion_result.errors.length > 0) {
      failure_count += 1;
      import_results.push({
        error_message: conversion_result.errors
          .map((error) => `[${error.column_name}]: ${error.error_message}`)
          .join(" | "),
        original_data: record,
        row_number,
        success: false,
      });
      continue;
    }
    const missing_required_fields = validate_bulk_import_required_fields(
      command.importable_fields,
      record,
      conversion_result.entity_input,
      conversion_result.name_columns,
    );
    if (missing_required_fields.length > 0) {
      failure_count += 1;
      import_results.push({
        error_message: `Missing required field(s): ${missing_required_fields.join(", ")}`,
        original_data: record,
        row_number,
        success: false,
      });
      continue;
    }
    const create_result = await use_cases.create(
      conversion_result.entity_input,
    );
    if (!create_result.success) {
      failure_count += 1;
      import_results.push({
        error_message: create_result.error || "Unknown error",
        original_data: record,
        row_number,
        success: false,
      });
      continue;
    }
    success_count += 1;
    import_results.push({
      error_message: "",
      original_data: record,
      row_number,
      success: true,
    });
  }
  return { failure_count, import_results, success_count };
}
