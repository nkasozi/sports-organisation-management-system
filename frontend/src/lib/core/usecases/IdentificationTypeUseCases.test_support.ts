import { vi } from "vitest";

import type {
  CreateIdentificationTypeInput,
  IdentificationType,
} from "../entities/IdentificationType";
import type { IdentificationTypeRepository } from "../interfaces/ports";

export function create_mock_repository(): IdentificationTypeRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    find_active_types: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_organization: vi.fn(),
  } as IdentificationTypeRepository;
}

export function create_test_type(
  overrides: Partial<IdentificationType> = {},
): IdentificationType {
  return {
    id: "type-123",
    name: "National ID",
    identifier_field_label: "ID Number",
    description: "Government issued national identification",
    status: "active",
    organization_id: "test-org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as IdentificationType;
}

export function create_valid_input(
  overrides: Partial<CreateIdentificationTypeInput> = {},
): CreateIdentificationTypeInput {
  return {
    name: "Passport",
    identifier_field_label: "Passport Number",
    description: "International passport",
    status: "active",
    organization_id: "test-org-1",
    ...overrides,
  } as CreateIdentificationTypeInput;
}
