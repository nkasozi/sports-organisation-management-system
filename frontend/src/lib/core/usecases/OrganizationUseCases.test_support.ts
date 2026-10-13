import { vi } from "vitest";

import type {
  CreateOrganizationInput,
  Organization,
} from "../entities/Organization";
import type { OrganizationRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): OrganizationRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_active_organizations: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as OrganizationRepository;
}

export function create_test_organization(
  overrides: Partial<ScalarInput<Organization>> = {},
): Organization {
  return {
    id: "org-123",
    name: "Test Organization",
    description: "Test Description",
    sport_id: "sport-123",
    founded_date: "2020-01-01",
    contact_email: "test@example.com",
    contact_phone: "+256700000000",
    address: "123 Test Street",
    website: "https://test.com",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Organization;
}

export function create_valid_input(
  overrides: Partial<CreateOrganizationInput> = {},
): CreateOrganizationInput {
  return {
    name: "New Organization",
    description: "New Description",
    sport_id: "sport-123",
    founded_date: "2020-01-01",
    contact_email: "new@example.com",
    contact_phone: "+256700000001",
    address: "456 New Street",
    website: "https://new.com",
    status: "active",
    ...overrides,
  } as CreateOrganizationInput;
}
