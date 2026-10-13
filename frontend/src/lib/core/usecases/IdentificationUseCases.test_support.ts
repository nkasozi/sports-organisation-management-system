import { vi } from "vitest";

import type {
  CreateIdentificationInput,
  Identification,
} from "../entities/Identification";
import type { IdentificationRepository } from "../interfaces/ports";

export function create_mock_repository(): IdentificationRepository {
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
  } as IdentificationRepository;
}

export function create_test_identification(
  overrides: Partial<Identification> = {},
): Identification {
  return {
    id: "id-123",
    holder_type: "player",
    holder_id: "player-123",
    identification_type_id: "type-123",
    identifier_value: "ID12345678",
    document_image_url: "",
    issue_date: "2024-01-01",
    expiry_date: "2029-01-01",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as Identification;
}

export function create_valid_input(
  overrides: Partial<CreateIdentificationInput> = {},
): CreateIdentificationInput {
  return {
    holder_type: "player",
    holder_id: "player-456",
    identification_type_id: "type-456",
    identifier_value: "ID98765432",
    document_image_url: "",
    issue_date: "2024-06-01",
    expiry_date: "2029-06-01",
    notes: "",
    status: "active",
    ...overrides,
  } as CreateIdentificationInput;
}
