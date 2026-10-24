import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";

const FOREIGN_KEY_FIELD_TYPE = "foreign_key";
const EMPTY_FIELD_VALUE = "";

function is_empty_value(value: unknown): boolean {
  return value == void 0 || value === EMPTY_FIELD_VALUE;
}

function pick_random_option(options: BaseEntity[]): string {
  return String(options[Math.floor(Math.random() * options.length)].id);
}

export function choose_required_foreign_keys(
  fields: FieldMetadata[],
  form_data: Record<string, unknown>,
  foreign_key_options: Record<string, BaseEntity[]>,
  locked_field_names: ReadonlySet<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter(
        (field) =>
          field.field_type === FOREIGN_KEY_FIELD_TYPE &&
          field.is_required &&
          !field.is_read_only &&
          !locked_field_names.has(field.field_name) &&
          is_empty_value(form_data[field.field_name]) &&
          (foreign_key_options[field.field_name] ?? []).length > 0,
      )
      .map((field) => [
        field.field_name,
        pick_random_option(foreign_key_options[field.field_name]),
      ]),
  );
}
