import type {
  EntityMetadata,
  FieldMetadata,
} from "$lib/core/entities/BaseEntity";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

const ID_DISPLAY_NAME = "ID";
const ID_FIELD_NAME = "id";
const STATUS_FIELD_NAME = "status";

function is_field_controlled_by_sub_entity_filter(
  field_name: string,
  sub_entity_filter?: SubEntityFilter,
): boolean {
  return Boolean(
    sub_entity_filter &&
    (field_name === sub_entity_filter.foreign_key_field ||
      field_name === sub_entity_filter.holder_type_field),
  );
}

export function get_dynamic_entity_list_available_fields(
  entity_metadata?: EntityMetadata,
  sub_entity_filter?: SubEntityFilter,
): FieldMetadata[] {
  if (!entity_metadata) return [];
  const id_field: FieldMetadata = {
    display_name: ID_DISPLAY_NAME,
    field_name: ID_FIELD_NAME,
    field_type: "string",
    is_read_only: true,
    is_required: false,
    show_in_list: false,
  };
  return [
    id_field,
    ...entity_metadata.fields.filter(
      (field: FieldMetadata) =>
        (!field.is_read_only ||
          field.field_name === ID_FIELD_NAME ||
          field.field_name === STATUS_FIELD_NAME) &&
        !is_field_controlled_by_sub_entity_filter(
          field.field_name,
          sub_entity_filter,
        ),
    ),
  ];
}

export function get_dynamic_entity_list_field_metadata_by_name(
  entity_metadata: EntityMetadata | undefined,
  field_name: string,
): FieldMetadata | undefined {
  return entity_metadata?.fields.find(
    (field: FieldMetadata) => field.field_name === field_name,
  );
}
