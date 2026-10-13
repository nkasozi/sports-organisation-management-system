import { type Mock, vi } from "vitest";

import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  type ConflictRecord,
  create_unknown_conflict_field_value,
} from "$lib/infrastructure/sync/conflictTypes";
import type { SyncResult } from "$lib/infrastructure/sync/convexSyncService";

const CONFLICT_ERROR_MESSAGE = "conflict detected";
const CONFLICT_TABLE_NAME = "teams";
const REMOTE_UPDATED_AT = "2024-04-30T09:00:00.000Z";

interface ManagerMock {
  convex_client: unknown;
  get_convex_client: Mock;
  is_configured: Mock;
  set_convex_client: Mock;
  sync_now: Mock;
  update_config: Mock;
}

interface SyncStoreMocks {
  manager: ManagerMock;
  initialize_sync_manager: Mock;
  get_sync_manager: Mock;
  get_last_sync_timestamp: Mock;
  add_conflicts_from_sync_response: Mock;
  execute_conflict_resolution: Mock;
}

export function create_sync_store_mocks(): SyncStoreMocks {
  const manager: ManagerMock = {
    convex_client: void 0 as unknown,
    get_convex_client: vi.fn(),
    is_configured: vi.fn(),
    set_convex_client: vi.fn(),
    sync_now: vi.fn(),
    update_config: vi.fn(),
  };

  return {
    manager,
    initialize_sync_manager: vi.fn(() => manager),
    get_sync_manager: vi.fn(() => manager),
    get_last_sync_timestamp: vi.fn(),
    add_conflicts_from_sync_response: vi.fn(),
    execute_conflict_resolution: vi.fn(),
  };
}

export function create_sync_service_module_mock(
  mocks: SyncStoreMocks,
): Record<string, Mock> {
  return {
    get_last_sync_timestamp: mocks.get_last_sync_timestamp,
    get_sync_manager: mocks.get_sync_manager,
    initialize_sync_manager: mocks.initialize_sync_manager,
  };
}

export function create_conflict_store_module_mock(mocks: SyncStoreMocks): {
  conflict_store: Record<string, Mock>;
} {
  return {
    conflict_store: {
      add_conflicts_from_sync_response: mocks.add_conflicts_from_sync_response,
    },
  };
}

export function prepare_sync_store_test(mocks: SyncStoreMocks): boolean {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-05-01T10:00:00.000Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.manager.convex_client = void 0;
  Object.values(mocks.manager)
    .filter((value) => vi.isMockFunction(value))
    .forEach((mock_function) => mock_function.mockReset());
  mocks.initialize_sync_manager.mockClear();
  mocks.get_sync_manager.mockClear();
  mocks.get_last_sync_timestamp.mockReset();
  mocks.add_conflicts_from_sync_response.mockReset();
  mocks.execute_conflict_resolution.mockReset();
  return true;
}

export function create_conflict_sync_result(
  local_id: string,
  duration_ms: number,
): Omit<SyncResult, "rejected_records" | "deleted_remotely"> {
  return {
    success: false,
    tables_synced: 0,
    records_pushed: 0,
    records_pulled: 0,
    errors: [
      { table_name: CONFLICT_TABLE_NAME, error: CONFLICT_ERROR_MESSAGE },
    ],
    duration_ms,
    conflicts: [
      {
        table_name: CONFLICT_TABLE_NAME,
        conflicts: [
          {
            local_id,
            local_data: { name: "Local Team" },
            local_version: 1,
            remote_data: { name: "Remote Team" },
            remote_version: 2,
            remote_updated_at: REMOTE_UPDATED_AT,
            remote_updated_by: create_unknown_conflict_field_value(),
          },
        ],
      },
    ],
  };
}

export function create_pending_team_conflict(
  local_id: string,
): ScalarInput<ConflictRecord> {
  return {
    id: "conflict-1",
    table_name: CONFLICT_TABLE_NAME,
    local_id,
    entity_display_name: "Team B",
    local_data: { name: "Local Team" },
    remote_data: { name: "Remote Team" },
    remote_version: 2,
    local_updated_at: "2024-04-29T00:00:00.000Z",
    remote_updated_at: "2024-04-30T00:00:00.000Z",
    remote_updated_by: create_unknown_conflict_field_value(),
    remote_updated_by_name: create_unknown_conflict_field_value(),
    field_differences: [],
    detected_at: "2024-05-01T09:59:00.000Z",
  };
}
