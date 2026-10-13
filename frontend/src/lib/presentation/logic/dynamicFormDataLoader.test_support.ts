import { vi } from "vitest";

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import type { GenericEntityUseCases } from "../../infrastructure/registry/entityUseCasesRegistry";

type MockUseCasesResult = {
  success: true;
  data: GenericEntityUseCases;
};

export function create_base_entity(
  id: string,
  overrides: Record<string, unknown> = {},
): BaseEntity {
  return {
    id,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as BaseEntity;
}

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

export function make_list_use_cases(
  entities: BaseEntity[],
  success = true,
): MockUseCasesResult {
  return {
    success: true as const,
    data: {
      list: vi
        .fn()
        .mockResolvedValue(
          success
            ? { success: true, data: { items: entities } }
            : { success: false, error: "fetch error" },
        ),
      get_by_id: vi.fn(),
    } as never,
  };
}

export function make_fixture_use_cases_with_data(
  fixture_data: unknown,
  success = true,
): MockUseCasesResult {
  return {
    success: true as const,
    data: {
      list: vi.fn(),
      get_by_id: vi
        .fn()
        .mockResolvedValue(
          success
            ? { success: true, data: fixture_data }
            : { success: false, error: "not found" },
        ),
    } as never,
  };
}
