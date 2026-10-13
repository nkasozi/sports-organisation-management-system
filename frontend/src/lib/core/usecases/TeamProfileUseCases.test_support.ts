import { expect, vi } from "vitest";

import type {
  CreateTeamProfileInput,
  TeamProfile,
} from "../entities/TeamProfile";
import type { TeamProfileRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";

export function create_mock_team_profile(
  overrides: Partial<ScalarInput<TeamProfile>> = {},
): TeamProfile {
  return {
    id: "teamprofile_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    team_id: "team_1",
    profile_summary: "Test team profile",
    visibility: "private",
    profile_slug: "test-team-1",
    featured_image_url: "",
    status: "active",
    ...overrides,
  } as unknown as TeamProfile;
}

export function create_valid_team_profile_input(
  overrides: Partial<CreateTeamProfileInput> = {},
): CreateTeamProfileInput {
  return {
    team_id: "team_1",
    profile_summary: "Test team profile",
    visibility: "private",
    profile_slug: "test-team-1",
    featured_image_url: "",
    status: "active",
    ...overrides,
  } as CreateTeamProfileInput;
}

export function create_paginated_result<T>(
  items: T[],
  total_count?: number,
): Result<PaginatedResult<T>, string> {
  return create_success_result({
    items,
    total_count: total_count ?? items.length,
    page_number: 1,
    page_size: 10,
    total_pages: Math.ceil((total_count ?? items.length) / 10),
  });
}

export function create_mock_repository(): TeamProfileRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_team_id: vi.fn(),
    find_by_slug: vi.fn(),
    find_public_profiles: vi.fn(),
  } as TeamProfileRepository;
}

export function expect_success<T>(result: Result<T, string>): T {
  if (!result.success) {
    return expect.unreachable(result.error);
  }
  return result.data;
}

export const INVALID_PROFILE_VISIBILITY =
  "invalid" as unknown as CreateTeamProfileInput["visibility"];
