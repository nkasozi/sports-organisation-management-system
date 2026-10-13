import { vi } from "vitest";

import type {
  CreateQualificationInput,
  Qualification,
} from "../entities/Qualification";
import type { QualificationRepository } from "../interfaces/ports";

export function create_mock_qualification_repository(): QualificationRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_holder: vi.fn(),
    find_active_qualifications: vi.fn(),
  } as QualificationRepository;
}

export function create_valid_qualification_input(
  overrides: Partial<CreateQualificationInput> = {},
): CreateQualificationInput {
  return {
    holder_type: "official",
    holder_id: "official-123",
    certification_name: "Referee Badge",
    certification_level: "national",
    certification_number: "REF-001",
    issuing_authority: "FA",
    issue_date: "2024-01-01",
    expiry_date: "2026-01-01",
    specializations: [],
    notes: "",
    status: "active",
    ...overrides,
  } as CreateQualificationInput;
}

export function create_test_qualification(
  overrides: Partial<Qualification> = {},
): Qualification {
  return {
    id: "qualification-123",
    ...create_valid_qualification_input(),
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as Qualification;
}
