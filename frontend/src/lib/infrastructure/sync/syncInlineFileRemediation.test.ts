import type { Table } from "dexie";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";

import {
  build_remediated_sync_records,
  remediate_oversized_inline_file_records,
  type SyncRemediableRecord,
} from "./syncInlineFileRemediation";
import { get_pulling_from_remote, set_pulling_from_remote } from "./syncState";
import { EPOCH_TIMESTAMP } from "./syncTypes";

const TEST_PAYLOAD_LIMIT_BYTES = 420;
const TEST_UPDATED_AT = "2024-05-02T10:00:00.000Z";
const TEST_CREATED_AT = "2024-05-01T10:00:00.000Z";

function create_team_record(command: {
  id: string;
  payload: string;
  updated_at?: string;
}): SyncRemediableRecord {
  return {
    id: command.id,
    name: `Team ${command.id}`,
    logo_url: `data:image/png;base64,${command.payload}`,
    updated_at: command.updated_at ?? TEST_UPDATED_AT,
    created_at: TEST_CREATED_AT,
  } as SyncRemediableRecord;
}

function create_mock_table(): Table<SyncRemediableRecord, string> {
  return {
    bulkPut: vi.fn().mockImplementation(async () => {}),
  } as unknown as Table<SyncRemediableRecord, string>;
}

describe("syncInlineFileRemediation", () => {
  beforeEach(() => {
    set_pulling_from_remote(false);
  });

  it("replaces an oversized inline team logo with the default team logo", () => {
    const oversized_record = create_team_record({
      id: "team-1",
      payload: "x".repeat(320),
    });

    const result = build_remediated_sync_records({
      table_name: "teams",
      all_local_records: [oversized_record],
      remote_latest_modified_at: EPOCH_TIMESTAMP,
      detect_conflicts: true,
      max_payload_bytes: TEST_PAYLOAD_LIMIT_BYTES,
    });

    expect(result.remediated_record_ids).toEqual(["team-1"]);
    expect(result.records[0].logo_url).toBe(DEFAULT_TEAM_LOGO);
  });

  it("does not change oversized records that are older than the remote cutoff", () => {
    const oversized_record = create_team_record({
      id: "team-2",
      payload: "y".repeat(320),
      updated_at: "2024-05-01T09:00:00.000Z",
    });

    const result = build_remediated_sync_records({
      table_name: "teams",
      all_local_records: [oversized_record],
      remote_latest_modified_at: "2024-05-01T12:00:00.000Z",
      detect_conflicts: true,
      max_payload_bytes: TEST_PAYLOAD_LIMIT_BYTES,
    });

    expect(result.remediated_record_ids).toEqual([]);
    expect(result.records[0].logo_url).toBe(oversized_record.logo_url);
  });

  it("persists remediated records and restores hook suppression state", async () => {
    const oversized_record = create_team_record({
      id: "team-3",
      payload: "z".repeat(320),
    });
    const mock_table = create_mock_table();

    const result = await remediate_oversized_inline_file_records({
      table: mock_table,
      table_name: "teams",
      all_local_records: [oversized_record],
      remote_latest_modified_at: EPOCH_TIMESTAMP,
      detect_conflicts: true,
      get_is_remote_sync_in_progress: get_pulling_from_remote,
      set_remote_sync_in_progress: set_pulling_from_remote,
      max_payload_bytes: TEST_PAYLOAD_LIMIT_BYTES,
    });

    expect(mock_table.bulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "team-3",
        logo_url: DEFAULT_TEAM_LOGO,
      }),
    ]);
    expect(result).toMatchObject({ success: true });
    if (!result.success) {
      throw new Error("Expected remediation to succeed");
    }
    expect(result.data.records[0].logo_url).toBe(DEFAULT_TEAM_LOGO);
    expect(get_pulling_from_remote()).toBe(false);
  });
});
