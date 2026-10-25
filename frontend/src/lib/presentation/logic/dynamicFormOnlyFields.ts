import type { FieldMetadata } from "../../core/entities/BaseEntity";

export function omit_form_only_fields(
  form_data: Record<string, unknown>,
  fields: readonly FieldMetadata[],
): Record<string, unknown> {
  const form_only_names = new Set(
    fields
      .filter((field) => field.is_form_only === true)
      .map((field) => field.field_name),
  );
  return Object.fromEntries(
    Object.entries(form_data).filter(
      ([field_name]) => !form_only_names.has(field_name),
    ),
  );
}
