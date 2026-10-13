import { vi } from "vitest";

import type {
  CreatePlayerPositionInput,
  PlayerPosition,
} from "../entities/PlayerPosition";
import type { PlayerPositionRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): PlayerPositionRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_code: vi.fn(),
    find_by_sport_type: vi.fn(),
    find_by_category: vi.fn(),
    find_available_positions: vi.fn(),
    find_by_organization: vi.fn(),
  } as PlayerPositionRepository;
}

export function create_test_position(
  overrides: Partial<ScalarInput<PlayerPosition>> = {},
): PlayerPosition {
  return {
    id: "position-123",
    name: "Goalkeeper",
    code: "GK",
    category: "goalkeeper",
    description: "Defends the goal",
    sport_type: "Football",
    display_order: 1,
    is_available: true,
    status: "active",
    organization_id: "test-org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerPosition;
}

export function create_valid_input(
  overrides: Partial<CreatePlayerPositionInput> = {},
): CreatePlayerPositionInput {
  return {
    name: "Striker",
    code: "ST",
    category: "forward",
    description: "Scores goals",
    sport_type: "Football",
    display_order: 10,
    is_available: true,
    status: "active",
    organization_id: "test-org-1",
    ...overrides,
  } as CreatePlayerPositionInput;
}
