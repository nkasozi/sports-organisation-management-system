import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";

export function create_field_metadata(
  overrides: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name: "test_field",
    display_name: "Test Field",
    field_type: "foreign_key",
    is_required: false,
    is_read_only: false,
    ...overrides,
  } as FieldMetadata;
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

export function create_fixture_entity(
  overrides: Record<string, unknown> = {},
): BaseEntity {
  return {
    ...create_base_entity(),
    home_team_id: "team_1",
    away_team_id: "team_2",
    home_team_name: "Lions FC",
    away_team_name: "Tigers FC",
    competition_id: "comp_1",
    scheduled_date: "2025-04-03",
    scheduled_time: "14:00",
    ...overrides,
  } as unknown as BaseEntity;
}

export function create_competition_entity(
  id: string,
  name: string,
): BaseEntity {
  return {
    ...create_base_entity({ id }),
    name,
  } as unknown as BaseEntity;
}
