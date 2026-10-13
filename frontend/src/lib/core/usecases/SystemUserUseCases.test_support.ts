import { vi } from "vitest";

import type {
  CreateSystemUserInput,
  SystemUser,
  UpdateSystemUserInput,
} from "../entities/SystemUser";
import type { Repository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";

export type MockRepository = Repository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput
>;

export function create_mock_repository(): MockRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
  } as MockRepository;
}

export function create_mock_user(
  overrides: Partial<ScalarInput<SystemUser>> = {},
): SystemUser {
  return {
    id: "user_1",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "player",
    organization_id: "org_1",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as SystemUser;
}

export function create_valid_user_input(
  overrides: Partial<CreateSystemUserInput> = {},
): CreateSystemUserInput {
  return {
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "player",
    organization_id: "org_1",
    ...overrides,
  } as CreateSystemUserInput;
}

export function create_success_result<T>(data: T): Result<T, string> {
  return { success: true, data } as Result<T, string>;
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
      total_pages: 1,
    },
  } as Result<PaginatedResult<T>, string>;
}
