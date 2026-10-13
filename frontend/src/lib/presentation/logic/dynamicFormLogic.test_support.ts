import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";

export function create_field_metadata(
  overrides: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name: "test_field",
    display_name: "Test Field",
    field_type: "string",
    is_required: false,
    is_read_only: false,
    ...overrides,
  } as FieldMetadata;
}

export function create_entity_metadata(
  overrides: Partial<EntityMetadata> = {},
): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name: "Test Entity",
    fields: [],
    ...overrides,
  } as EntityMetadata;
}

export function create_base_entity(
  overrides: Partial<ScalarInput<BaseEntity>> = {},
): BaseEntity {
  return {
    id: "entity_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as BaseEntity;
}
