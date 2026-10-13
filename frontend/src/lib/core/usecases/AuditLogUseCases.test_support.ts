import { type MockedFunction, vi } from "vitest";

import type { AuditLog, CreateAuditLogInput } from "../entities/AuditLog";
import type { AuditLogRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";
import type { PaginatedResult, Result } from "../types/Result";

export type MockRepository = Partial<AuditLogRepository> & {
  find_all: MockedFunction<AuditLogRepository["find_all"]>;
  find_by_id: MockedFunction<AuditLogRepository["find_by_id"]>;
  find_by_ids: MockedFunction<AuditLogRepository["find_by_ids"]>;
  create: MockedFunction<AuditLogRepository["create"]>;
  update: MockedFunction<AuditLogRepository["update"]>;
  delete_by_id: MockedFunction<AuditLogRepository["delete_by_id"]>;
  delete_by_ids: MockedFunction<AuditLogRepository["delete_by_ids"]>;
  count: MockedFunction<AuditLogRepository["count"]>;
  find_by_entity: MockedFunction<AuditLogRepository["find_by_entity"]>;
};

export function create_mock_repository(): MockRepository {
  return {
    find_all: vi.fn() as MockedFunction<AuditLogRepository["find_all"]>,
    find_by_id: vi.fn() as MockedFunction<AuditLogRepository["find_by_id"]>,
    find_by_ids: vi.fn() as MockedFunction<AuditLogRepository["find_by_ids"]>,
    create: vi.fn() as MockedFunction<AuditLogRepository["create"]>,
    update: vi.fn() as MockedFunction<AuditLogRepository["update"]>,
    delete_by_id: vi.fn() as MockedFunction<AuditLogRepository["delete_by_id"]>,
    delete_by_ids: vi.fn() as MockedFunction<
      AuditLogRepository["delete_by_ids"]
    >,
    count: vi.fn() as MockedFunction<AuditLogRepository["count"]>,
    find_by_entity: vi.fn() as MockedFunction<
      AuditLogRepository["find_by_entity"]
    >,
  } as MockRepository;
}

export function create_mock_audit_log(
  overrides: Partial<ScalarInput<AuditLog>> = {},
): AuditLog {
  return {
    id: "log_1",
    entity_type: "player",
    entity_id: "player_123",
    entity_display_name: "John Doe",
    action: "create",
    user_id: "user_456",
    user_email: "admin@example.com",
    user_display_name: "Admin User",
    organization_id: "org_1",
    changes: [],
    timestamp: "2024-01-01T00:00:00Z",
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as AuditLog;
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

export function create_valid_audit_log_input(): CreateAuditLogInput {
  return {
    entity_type: "player",
    entity_id: "player_123",
    entity_display_name: "John Doe",
    action: "create",
    user_id: "user_456",
    user_email: "admin@example.com",
    user_display_name: "Admin User",
    organization_id: "org_1",
    changes: [],
  } as CreateAuditLogInput;
}
