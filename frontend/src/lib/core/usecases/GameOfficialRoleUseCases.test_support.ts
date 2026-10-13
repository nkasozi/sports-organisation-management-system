import { vi } from "vitest";

import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
} from "../entities/GameOfficialRole";
import type { GameOfficialRoleRepository } from "../interfaces/ports";

export function create_mock_repository(): GameOfficialRoleRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_sport: vi.fn(),
    find_head_officials: vi.fn(),
    find_by_organization: vi.fn(),
  } as GameOfficialRoleRepository;
}

export function create_test_role(
  overrides: Partial<GameOfficialRole> = {},
): GameOfficialRole {
  return {
    id: "role-123",
    name: "Referee",
    code: "REF",
    description: "Main match official",
    sport_id: "sport-123",
    is_on_field: true,
    is_head_official: true,
    display_order: 1,
    status: "active",
    organization_id: "test-org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as GameOfficialRole;
}

export function create_valid_input(
  overrides: Partial<CreateGameOfficialRoleInput> = {},
): CreateGameOfficialRoleInput {
  return {
    name: "Assistant Referee",
    code: "AR",
    description: "Assists main referee",
    sport_id: "sport-123",
    is_on_field: true,
    is_head_official: false,
    display_order: 2,
    status: "active",
    organization_id: "test-org-1",
    ...overrides,
  } as CreateGameOfficialRoleInput;
}
