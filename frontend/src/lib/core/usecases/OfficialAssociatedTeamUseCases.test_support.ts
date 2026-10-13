import { expect, vi } from "vitest";

import type {
  CreateOfficialAssociatedTeamInput,
  OfficialAssociatedTeam,
} from "../entities/OfficialAssociatedTeam";
import type { OfficialAssociatedTeamRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";

export function create_mock_repository(): OfficialAssociatedTeamRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_official: vi.fn(),
    find_by_team: vi.fn(),
  } as OfficialAssociatedTeamRepository;
}

export function create_test_association(
  overrides: Partial<ScalarInput<OfficialAssociatedTeam>> = {},
): OfficialAssociatedTeam {
  return {
    id: "assoc-123",
    official_id: "official-1",
    team_id: "team-1",
    association_type: "current_member",
    start_date: "2024-01-01",
    end_date: "",
    notes: "",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as OfficialAssociatedTeam;
}

export function create_valid_input(
  overrides: Partial<CreateOfficialAssociatedTeamInput> = {},
): CreateOfficialAssociatedTeamInput {
  return {
    official_id: "official-1",
    team_id: "team-1",
    association_type: "current_member",
    start_date: "2024-01-01",
    end_date: "",
    notes: "",
    status: "active",
    ...overrides,
  } as CreateOfficialAssociatedTeamInput;
}

export function create_empty_page(): Result<
  PaginatedResult<OfficialAssociatedTeam>
> {
  return {
    success: true,
    data: {
      items: [],
      total_count: 0,
      page_number: 1,
      page_size: 100,
      total_pages: 0,
    },
  };
}

export function expect_failure_message<T>(result: Result<T>): string {
  if (result.success) {
    return expect.unreachable("expected a failure result");
  }
  return result.error;
}
