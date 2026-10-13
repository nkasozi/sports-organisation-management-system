import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import {
  BULK_IMPORT_CSV_DELIMITER,
  BULK_IMPORT_CSV_LINE_BREAK,
  BULK_IMPORT_CSV_MIME_TYPE,
  BULK_IMPORT_CSV_QUOTE,
  BULK_IMPORT_FAILURE_REASON_COLUMN,
  BULK_IMPORT_TRUTHY_VALUES,
} from "$lib/presentation/logic/bulkImportConstants";
import { generate_bulk_import_example_value } from "$lib/presentation/logic/bulkImportCsvExampleValues";
import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";
import { DYNAMIC_FORM_FIELD_TYPE } from "$lib/presentation/logic/dynamicFormConstants";

function convert_value_for_field_type(
  value: string,
  field_type: FieldMetadata["field_type"],
): unknown {
  switch (field_type) {
    case DYNAMIC_FORM_FIELD_TYPE.NUMBER: {
      const numeric_value = parseFloat(value);
      return Number.isNaN(numeric_value) ? value : numeric_value;
    }
    case DYNAMIC_FORM_FIELD_TYPE.BOOLEAN:
      return BULK_IMPORT_TRUTHY_VALUES.has(value.toLowerCase());
    case DYNAMIC_FORM_FIELD_TYPE.STRING:
    case DYNAMIC_FORM_FIELD_TYPE.STAR_RATING:
    case DYNAMIC_FORM_FIELD_TYPE.DATE:
    case DYNAMIC_FORM_FIELD_TYPE.ENUM:
    case DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY:
    case DYNAMIC_FORM_FIELD_TYPE.FILE:
    case DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY:
    case DYNAMIC_FORM_FIELD_TYPE.OFFICIAL_ASSIGNMENT_ARRAY:
    case DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY:
      return value;
  }
}

export function generate_bulk_import_csv_template(
  importable_fields: FieldMetadata[],
): string {
  const header_row = importable_fields
    .map((field: FieldMetadata) => field.field_name)
    .join(BULK_IMPORT_CSV_DELIMITER);
  const example_row = importable_fields
    .map((field: FieldMetadata) => generate_bulk_import_example_value(field))
    .join(BULK_IMPORT_CSV_DELIMITER);
  return [header_row, example_row].join(BULK_IMPORT_CSV_LINE_BREAK);
}

export function parse_bulk_import_csv_line(line: string): string[] {
  const values: string[] = [];
  let current_value = "";
  let in_quotes = false;
  for (const character of line) {
    if (character === BULK_IMPORT_CSV_QUOTE) {
      in_quotes = !in_quotes;
      continue;
    }
    if (character === BULK_IMPORT_CSV_DELIMITER && !in_quotes) {
      values.push(current_value.trim());
      current_value = "";
      continue;
    }
    current_value += character;
  }
  values.push(current_value.trim());
  return values;
}

export function parse_bulk_import_csv_content(
  content: string,
): Record<string, string>[] {
  const lines = content
    .split(BULK_IMPORT_CSV_LINE_BREAK)
    .filter((line: string) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parse_bulk_import_csv_line(lines[0]);
  return lines.slice(1).map((line: string) => {
    const values = parse_bulk_import_csv_line(line);
    return headers.reduce(
      (record: Record<string, string>, header: string, index: number) => {
        record[header] = values[index] || "";
        return record;
      },
      {},
    );
  });
}

export function convert_bulk_import_record_to_entity_input(
  importable_fields: FieldMetadata[],
  record: Record<string, string>,
): Record<string, unknown> {
  return importable_fields.reduce(
    (entity_input: Record<string, unknown>, field: FieldMetadata) => {
      const raw_value = record[field.field_name];
      const is_blank_value = !raw_value;
      if (is_blank_value && field.is_required) {
        entity_input[field.field_name] = "";
        return entity_input;
      }
      if (is_blank_value) return entity_input;
      entity_input[field.field_name] = convert_value_for_field_type(
        raw_value,
        field.field_type,
      );
      return entity_input;
    },
    {},
  );
}

function quote_csv_value_when_needed(value: string): string {
  return value.includes(BULK_IMPORT_CSV_DELIMITER)
    ? `${BULK_IMPORT_CSV_QUOTE}${value}${BULK_IMPORT_CSV_QUOTE}`
    : value;
}

export function generate_bulk_import_failure_report(
  import_results: BulkImportResult[],
  importable_fields: FieldMetadata[],
): string {
  const failed_results = import_results.filter(
    (result: BulkImportResult) => !result.success,
  );
  if (failed_results.length === 0) return "";
  const original_headers = importable_fields.map(
    (field: FieldMetadata) => field.field_name,
  );
  const header_row = [
    ...original_headers,
    BULK_IMPORT_FAILURE_REASON_COLUMN,
  ].join(BULK_IMPORT_CSV_DELIMITER);
  const data_rows = failed_results.map((result: BulkImportResult) => {
    const original_values = original_headers.map((header: string) => {
      const value = result.original_data[header] || "";
      return quote_csv_value_when_needed(value);
    });
    const error_value = quote_csv_value_when_needed(result.error_message);
    return [...original_values, error_value].join(BULK_IMPORT_CSV_DELIMITER);
  });
  return [header_row, ...data_rows].join(BULK_IMPORT_CSV_LINE_BREAK);
}

export function download_bulk_import_csv(
  csv_content: string,
  filename: string,
): void {
  if (!csv_content) return;
  const blob = new Blob([csv_content], { type: BULK_IMPORT_CSV_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
