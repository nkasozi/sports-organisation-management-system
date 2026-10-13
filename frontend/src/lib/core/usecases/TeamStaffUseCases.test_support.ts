import { vi } from "vitest";

import type { CreateTeamStaffInput, TeamStaff } from "../entities/TeamStaff";
import type { TeamStaffRepository } from "../interfaces/ports";
import type { TeamStaffRoleRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): TeamStaffRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_team: vi.fn(),
    find_by_role: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  } as TeamStaffRepository;
}

export function create_mock_roles_repository(): TeamStaffRoleRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_category: vi.fn(),
    find_by_organization: vi.fn(),
  } as TeamStaffRoleRepository;
}

export function create_test_staff(
  overrides: Partial<ScalarInput<TeamStaff>> = {},
): TeamStaff {
  return {
    id: "staff-123",
    organization_id: "org-123",
    first_name: "John",
    last_name: "Coach",
    email: "john@example.com",
    phone: "",
    date_of_birth: "",
    team_id: "team-123",
    role_id: "role-123",
    nationality: "",
    profile_image_url: "",
    employment_start_date: "",
    employment_end_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as TeamStaff;
}

export function create_valid_input(
  overrides: Partial<CreateTeamStaffInput> = {},
): CreateTeamStaffInput {
  return {
    organization_id: "org-123",
    first_name: "Jane",
    last_name: "Manager",
    email: "jane@example.com",
    phone: "",
    date_of_birth: "",
    team_id: "team-123",
    role_id: "role-456",
    nationality: "",
    profile_image_url: "",
    employment_start_date: "",
    employment_end_date: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
    ...overrides,
  } as CreateTeamStaffInput;
}
