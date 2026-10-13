import { describe, expect, it } from "vitest";

import {
  get_push_excluded_tables_for_unsigned_user,
  type SyncResult,
  TABLE_NAMES,
} from "./syncTypes";

describe("syncTypes", () => {
  it("returns every synced table when no role is available", () => {
    const excluded_tables = get_push_excluded_tables_for_unsigned_user();

    expect([...excluded_tables]).toEqual([...TABLE_NAMES]);
  });
});

describe("sync_all_tables shape", () => {
  it("SyncResult has expected structure", () => {
    const mock_result: SyncResult = {
      success: true,
      tables_synced: 5,
      records_pushed: 10,
      records_pulled: 3,
      errors: [],
      duration_ms: 500,
      conflicts: [],
      rejected_records: [],
      deleted_remotely: [],
    };

    expect(mock_result.success).toBe(true);
    expect(mock_result.tables_synced).toBe(5);
    expect(mock_result.records_pushed).toBe(10);
    expect(mock_result.records_pulled).toBe(3);
    expect(mock_result.errors).toHaveLength(0);
    expect(mock_result.conflicts).toHaveLength(0);
  });
});
