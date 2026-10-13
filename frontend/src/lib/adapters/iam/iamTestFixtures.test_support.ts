import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type { PaginatedResult } from "../../core/types/Result";

export function create_paginated_result<TData>(
  items: TData[],
): PaginatedResult<TData> {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: items.length || 1,
    total_pages: 1,
  };
}

export function create_system_user(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "system_user_1",
    email: "admin@example.com",
    role: "org_admin",
    status: ENTITY_STATUS.ACTIVE,
    ...overrides,
  };
}
