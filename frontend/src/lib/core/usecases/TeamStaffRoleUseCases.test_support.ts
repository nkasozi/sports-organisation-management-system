import { vi } from "vitest";

import type {
  CreateTeamStaffRoleInput,
  TeamStaffRole,
} from "../entities/TeamStaffRole";
import type { TeamStaffRoleRepository } from "../interfaces/ports";

export function create_mock_repository(): TeamStaffRoleRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_category: vi.fn(),
    find_by_organization: vi.fn(),
  } as TeamStaffRoleRepository;
}

export function create_test_role(
  overrides: Partial<TeamStaffRole> = {},
): TeamStaffRole {
  return {
    id: "role-123",
    name: "Head Coach",
    code: "HC",
    description: "Main team coach",
    category: "coaching",
    is_primary_contact: true,
    display_order: 1,
    status: "active",
    organization_id: "test-org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as TeamStaffRole;
}

export function create_valid_input(
  overrides: Partial<CreateTeamStaffRoleInput> = {},
): CreateTeamStaffRoleInput {
  return {
    name: "Assistant Coach",
    code: "AC",
    description: "Assists the head coach",
    category: "coaching",
    is_primary_contact: false,
    display_order: 2,
    status: "active",
    organization_id: "test-org-1",
    ...overrides,
  } as CreateTeamStaffRoleInput;
}
