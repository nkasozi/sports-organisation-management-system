import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";

const CREATED_AT_FIELD_NAME = "created_at";
const ID_FIELD_NAME = "id";
const UPDATED_AT_FIELD_NAME = "updated_at";

export function get_bulk_import_fields(
  fields: FieldMetadata[],
): FieldMetadata[] {
  return fields.filter((field: FieldMetadata) => {
    if (field.is_read_only) return false;
    if (field.field_type === "file" || field.field_type === "sub_entity")
      return false;
    if (field.field_name === ID_FIELD_NAME) return false;
    if (
      field.field_name === CREATED_AT_FIELD_NAME ||
      field.field_name === UPDATED_AT_FIELD_NAME
    )
      return false;
    return true;
  });
}

export function get_bulk_import_foreign_key_fields(
  fields: FieldMetadata[],
): FieldMetadata[] {
  return fields.filter(
    (field: FieldMetadata) => field.field_type === "foreign_key",
  );
}

export function get_bulk_import_enum_fields(
  fields: FieldMetadata[],
): FieldMetadata[] {
  return fields.filter((field: FieldMetadata) => field.field_type === "enum");
}

export function get_bulk_import_related_entity_display_name(
  field: FieldMetadata,
): string {
  if (!field.foreign_key_entity) return "related record";
  const related_metadata = entityMetadataRegistry.get_entity_metadata(
    field.foreign_key_entity.toLowerCase(),
  );
  return related_metadata?.display_name || field.foreign_key_entity;
}
