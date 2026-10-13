import { vi } from "vitest";

import type { CreateTeamInput, Team } from "../entities/Team";
import type { TeamRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";

export function create_mock_team(
  overrides: Partial<ScalarInput<Team>> = {},
): Team {
  return {
    id: "team_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    name: "Test Team FC",
    short_name: "TTF",
    description: "A test team",
    organization_id: "org_1",
    gender_id: "",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    ...overrides,
  } as unknown as Team;
}

export function create_valid_team_input(
  overrides: Partial<CreateTeamInput> = {},
): CreateTeamInput {
  return {
    name: "Test Team FC",
    short_name: "TTF",
    description: "A test team",
    organization_id: "org_1",
    gender_id: "",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    ...overrides,
  } as CreateTeamInput;
}

export function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return {
    success: true,
    data: {
      items,
      total_count: total_count ?? items.length,
      page_number: 1,
      page_size: 10,
      total_pages: Math.ceil((total_count ?? items.length) / 10),
    },
  } as Result<PaginatedResult<T>, string>;
}

export function create_mock_repository(): TeamRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_organization: vi.fn(),
    find_active_teams: vi.fn(),
  } as TeamRepository;
}
