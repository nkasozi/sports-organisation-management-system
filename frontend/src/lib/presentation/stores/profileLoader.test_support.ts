import { vi } from "vitest";

import type { SystemUser } from "$lib/core/entities/SystemUser";
import type {
  OrganizationRepository,
  SystemUserRepository,
  TeamRepository,
} from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import { create_success_result } from "$lib/core/types/Result";

export function create_test_system_user(
  overrides: Partial<ScalarInput<SystemUser>> = {},
): SystemUser {
  return {
    id: "usr_test_1",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "org_admin",
    status: "active",
    organization_id: "org_1",
    team_id: "team_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as SystemUser;
}

export function create_mock_system_user_repository(
  return_value: ReturnType<SystemUserRepository["find_all"]>,
): SystemUserRepository {
  return {
    find_active_users: vi.fn(),
    find_all: vi.fn().mockReturnValue(return_value),
    find_by_email: vi.fn(),
    find_by_role: vi.fn(),
    find_admins: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as SystemUserRepository;
}

export function create_mock_org_repository(
  organizations: Array<{ id: string; name: string }> = [],
): OrganizationRepository {
  return {
    find_by_ids: vi.fn().mockResolvedValue(
      create_success_result(
        organizations.map((org) => ({
          id: org.id,
          name: org.name,
          description: "",
          sport_id: "",
          founded_date: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          website: "",
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        })),
      ),
    ),
    find_active_organizations: vi.fn(),
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as OrganizationRepository;
}

function create_test_team_record(team: {
  id: string;
  name: string;
}): Record<string, unknown> {
  return {
    id: team.id,
    name: team.name,
    short_name: team.name,
    description: "",
    organization_id: "org_1",
    gender_id: "",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#000000",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2024,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

export function create_mock_team_repository(
  teams: Array<{ id: string; name: string }> = [],
): TeamRepository {
  return {
    find_by_ids: vi
      .fn()
      .mockResolvedValue(
        create_success_result(teams.map(create_test_team_record)),
      ),
    find_active_teams: vi.fn(),
    find_by_organization: vi.fn(),
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    count: vi.fn(),
    has_data: vi.fn(),
    seed_with_data: vi.fn(),
    clear_all_data: vi.fn(),
  } as unknown as TeamRepository;
}
