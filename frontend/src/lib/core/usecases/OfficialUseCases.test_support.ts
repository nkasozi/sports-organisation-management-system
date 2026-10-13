import { vi } from "vitest";

import type { CreateOfficialInput, Official } from "../entities/Official";
import type { OfficialRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): OfficialRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_organization: vi.fn(),
    find_active_officials: vi.fn(),
    find_available_for_date: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as OfficialRepository;
}

export function create_test_official(
  overrides: Partial<ScalarInput<Official>> = {},
): Official {
  return {
    id: "official-123",
    first_name: "John",
    last_name: "Referee",
    gender_id: "gender_default_male",
    email: "john@example.com",
    phone: "+256700123456",
    date_of_birth: "1985-05-15",
    organization_id: "org-123",
    years_of_experience: 5,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+256700000001",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Official;
}

export function create_valid_input(
  overrides: Partial<CreateOfficialInput> = {},
): CreateOfficialInput {
  return {
    first_name: "John",
    last_name: "Referee",
    gender_id: "gender_default_male",
    email: "john@example.com",
    phone: "+256700123456",
    date_of_birth: "1985-05-15",
    organization_id: "org-123",
    years_of_experience: 5,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+256700000001",
    notes: "",
    status: "active",
    ...overrides,
  } as CreateOfficialInput;
}
