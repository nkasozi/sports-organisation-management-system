import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import {
  type GenericEntityUseCases,
  get_use_cases_for_entity_type,
} from "$lib/infrastructure/registry/entityUseCasesRegistry";
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
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

type BulkImportCommand = {
  entity_type: string;
  file_content: string;
  foreign_key_fields: FieldMetadata[];
  importable_fields: FieldMetadata[];
};

type BulkImportSummary = {
  failure_count: number;
  import_results: BulkImportResult[];
  success_count: number;
};

type BulkImportRecord = ReturnType<
  typeof parse_bulk_import_csv_content
>[number];

type BulkImportConversion = Awaited<
  ReturnType<typeof convert_bulk_import_record_with_name_resolution>
>;

type BulkImportRowContext = {
  command: BulkImportCommand;
  use_cases: GenericEntityUseCases;
  name_columns: BulkImportConversion["name_columns"];
};

async function convert_bulk_import_row(
  context: BulkImportRowContext,
  record: BulkImportRecord,
): Promise<BulkImportConversion> {
  if (context.name_columns.length > 0) {
    return convert_bulk_import_record_with_name_resolution(
      context.command.foreign_key_fields,
      context.command.importable_fields,
      record,
    );
  }
  return {
    entity_input: convert_bulk_import_record_to_entity_input(
      context.command.importable_fields,
      record,
    ),
    errors: [],
    name_columns: context.name_columns,
  };
}

function build_failed_row_result(
  record: BulkImportRecord,
  row_number: number,
  error_message: string,
): BulkImportResult {
  return { error_message, original_data: record, row_number, success: false };
}

type BulkImportRowErrorState =
  | { status: "none" }
  | { status: "present"; error_message: string };

function detect_bulk_import_row_error(
  context: BulkImportRowContext,
  record: BulkImportRecord,
  conversion_result: BulkImportConversion,
): BulkImportRowErrorState {
  if (conversion_result.errors.length > 0) {
    return {
      status: "present",
      error_message: conversion_result.errors
        .map((error) => `[${error.column_name}]: ${error.error_message}`)
        .join(" | "),
    };
  }
  const missing_required_fields = validate_bulk_import_required_fields(
    context.command.importable_fields,
    record,
    conversion_result.entity_input,
    conversion_result.name_columns,
  );
  return missing_required_fields.length > 0
    ? {
        status: "present",
        error_message: `Missing required field(s): ${missing_required_fields.join(", ")}`,
      }
    : { status: "none" };
}

async function import_bulk_import_row(
  context: BulkImportRowContext,
  record: BulkImportRecord,
  row_number: number,
): Promise<BulkImportResult> {
  const conversion_result = await convert_bulk_import_row(context, record);
  const row_error = detect_bulk_import_row_error(
    context,
    record,
    conversion_result,
  );
  if (row_error.status === PRESENCE_STATUS.PRESENT)
    return build_failed_row_result(record, row_number, row_error.error_message);
  const create_result = await context.use_cases.create(
    conversion_result.entity_input,
  );
  if (!create_result.success)
    return build_failed_row_result(
      record,
      row_number,
      create_result.error || "Unknown error",
    );
  return {
    error_message: "",
    original_data: record,
    row_number,
    success: true,
  };
}

function build_missing_use_cases_summary(
  entity_type: string,
): BulkImportSummary {
  return {
    failure_count: 1,
    import_results: [
      {
        error_message: `No use cases found for entity type: ${entity_type}`,
        original_data: {},
        row_number: 0,
        success: false,
      },
    ],
    success_count: 0,
  };
}

function summarize_bulk_import_results(
  import_results: BulkImportResult[],
): BulkImportSummary {
  const success_count = import_results.filter(
    (result: BulkImportResult) => result.success,
  ).length;
  return {
    failure_count: import_results.length - success_count,
    import_results,
    success_count,
  };
}

export async function execute_bulk_import(
  command: BulkImportCommand,
): Promise<BulkImportSummary> {
  const records = parse_bulk_import_csv_content(command.file_content);
  const import_use_cases_result = get_use_cases_for_entity_type(
    command.entity_type.toLowerCase(),
  );
  if (!import_use_cases_result.success)
    return build_missing_use_cases_summary(command.entity_type);
  const context: BulkImportRowContext = {
    command,
    use_cases: import_use_cases_result.data,
    name_columns: records[0]
      ? find_bulk_import_name_columns(command.foreign_key_fields, records[0])
      : [],
  };
  const import_results: BulkImportResult[] = [];
  for (const [index, record] of records.entries()) {
    import_results.push(
      await import_bulk_import_row(context, record, index + 2),
    );
  }
  return summarize_bulk_import_results(import_results);
}
