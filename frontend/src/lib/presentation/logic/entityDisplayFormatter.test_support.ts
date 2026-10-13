import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";

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
