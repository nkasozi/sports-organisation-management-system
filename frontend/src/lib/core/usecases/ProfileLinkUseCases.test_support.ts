import { expect, vi } from "vitest";

import type {
  CreateProfileLinkInput,
  ProfileLink,
} from "../entities/ProfileLink";
import type { ProfileLinkRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";

export function create_mock_profile_link(
  overrides: Partial<ScalarInput<ProfileLink>> = {},
): ProfileLink {
  return {
    id: "profilelink_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profile_id: "profile_1",
    platform: "twitter",
    title: "Follow on Twitter",
    url: "https://twitter.com/username",
    display_order: 0,
    status: "active",
    ...overrides,
  } as unknown as ProfileLink;
}

export function create_valid_profile_link_input(
  overrides: Partial<CreateProfileLinkInput> = {},
): CreateProfileLinkInput {
  return {
    profile_id: "profile_1",
    platform: "twitter",
    title: "Follow on Twitter",
    url: "https://twitter.com/username",
    display_order: 0,
    status: "active",
    ...overrides,
  } as CreateProfileLinkInput;
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

export function create_mock_repository(): ProfileLinkRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_profile_id: vi.fn(),
  } as ProfileLinkRepository;
}

export function expect_success<T>(result: Result<T, string>): T {
  if (!result.success) {
    return expect.unreachable(result.error);
  }
  return result.data;
}
