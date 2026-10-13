import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";

export function create_test_entity(
  id: string,
  name: string,
  status: string = "active",
): BaseEntity {
  return {
    id,
    name,
    status,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  } as unknown as BaseEntity;
}

export function create_test_field_metadata(
  field_name: string,
  field_type: string,
  options: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name,
    field_type,
    display_name: options.display_name || field_name,
    show_in_list: options.show_in_list ?? true,
    show_in_form: options.show_in_form ?? true,
    is_required: options.is_required ?? false,
    is_read_only: options.is_read_only ?? false,
    foreign_key_entity: options.foreign_key_entity,
    ...options,
  } as FieldMetadata;
}

export function create_test_entity_metadata(
  fields: FieldMetadata[],
  display_name: string = "Test Entity",
): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name,
    fields,
  } as EntityMetadata;
}
