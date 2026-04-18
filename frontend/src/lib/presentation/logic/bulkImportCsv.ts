import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

function generate_example_value_for_field(field: FieldMetadata): string {
  switch (field.field_type) {
    case "string":
      if (field.field_name.includes("email")) return "example@email.com";
      if (field.field_name.includes("phone")) return "+1234567890";
      if (field.field_name.includes("name")) return "Example Name";
      return "text_value";
    case "number":
      if (field.field_name.includes("year")) return "2020";
      if (field.field_name.includes("height")) return "180";
      if (field.field_name.includes("weight")) return "75";
      return "0";
    case "date":
      return "2000-01-15";
    case "boolean":
      return "true";
    case "enum":
      return field.enum_values?.[0] || "value";
    case "foreign_key":
      return `${field.foreign_key_entity?.toLowerCase() || "entity"}_default_1`;
    default:
      return "";
  }
}

function convert_value_for_field_type(
  value: string,
  field_type: string,
): unknown {
  switch (field_type) {
    case "number": {
      const numeric_value = parseFloat(value);
      return Number.isNaN(numeric_value) ? value : numeric_value;
    }
    case "boolean":
      return value.toLowerCase() === "true" || value === "1";
    case "date":
      return value;
    default:
      return value;
  }
}

export function generate_bulk_import_csv_template(
  importable_fields: FieldMetadata[],
): string {
  const header_row = importable_fields
    .map((field: FieldMetadata) => field.field_name)
    .join(",");
  const example_row = importable_fields
    .map((field: FieldMetadata) => generate_example_value_for_field(field))
    .join(",");
  return `${header_row}\n${example_row}`;
}

export function parse_bulk_import_csv_line(line: string): string[] {
  const values: string[] = [];
  let current_value = "";
  let in_quotes = false;
  for (const character of line) {
    if (character === '"') {
      in_quotes = !in_quotes;
      continue;
    }
    if (character === "," && !in_quotes) {
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
    .split("\n")
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
      if (raw_value === void 0 || raw_value === "") {
        if (field.is_required) entity_input[field.field_name] = "";
        return entity_input;
      }
      entity_input[field.field_name] = convert_value_for_field_type(
        raw_value,
        field.field_type,
      );
      return entity_input;
    },
    {},
  );
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
  const header_row = [...original_headers, "import_error_reason"].join(",");
  const data_rows = failed_results.map((result: BulkImportResult) => {
    const original_values = original_headers.map((header: string) => {
      const value = result.original_data[header] || "";
      return value.includes(",") ? `"${value}"` : value;
    });
    const error_value = result.error_message.includes(",")
      ? `"${result.error_message}"`
      : result.error_message;
    return [...original_values, error_value].join(",");
  });
  return [header_row, ...data_rows].join("\n");
}

export function download_bulk_import_csv(
  csv_content: string,
  filename: string,
): void {
  if (!csv_content) return;
  const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
