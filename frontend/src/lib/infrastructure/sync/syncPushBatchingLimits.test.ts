import { describe, expect, it } from "vitest";

import { build_sync_push_batches } from "./syncPushBatching";

function create_record(local_id: string): {
  local_id: string;
  data: Record<string, unknown>;
  version: number;
} {
  return { local_id, data: { id: local_id }, version: 1 };
}

describe("syncPushBatching limits", () => {
  it("returns no batches for no records", () => {
    const result = build_sync_push_batches({
      table_name: "teams",
      records: [],
      detect_conflicts: false,
    });

    expect(result).toEqual({ success: true, data: [] });
  });

  it("splits records by the maximum batch record count", () => {
    const records = ["a", "b", "c", "d", "e"].map(create_record);

    const result = build_sync_push_batches({
      table_name: "teams",
      records,
      detect_conflicts: false,
      max_batch_record_count: 2,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual([
      [records[0], records[1]],
      [records[2], records[3]],
      [records[4]],
    ]);
  });

  it("uses the default batch record count of 25", () => {
    const records = Array.from({ length: 26 }, (_, index) =>
      create_record(`r${index}`),
    );

    const result = build_sync_push_batches({
      table_name: "teams",
      records,
      detect_conflicts: true,
    });

    expect(result.success && result.data.map((batch) => batch.length)).toEqual([
      25, 1,
    ]);
  });

  it("reports a generic oversize error when no inline data field exists", () => {
    const record = {
      local_id: "big",
      data: { id: "big", notes: "n".repeat(500) },
      version: 1,
    };

    const result = build_sync_push_batches({
      table_name: "teams",
      records: [create_record("small"), record],
      detect_conflicts: true,
      max_payload_bytes: 200,
    });

    expect(result).toEqual({
      success: false,
      error:
        'Record "big" in "teams" is too large to sync because its payload exceeds the sync payload limit. Choose a smaller image and try again.',
    });
  });
});
