import { describe, expect, it } from "vitest";

import { build_sync_push_batches } from "./syncPushBatching";

const TEST_TABLE_NAME = "teams" as const;
const TEST_VERSION = 1700000000000;
const TEST_PAYLOAD_LIMIT_BYTES = 420;

function create_sync_batch_record(command: {
  local_id: string;
  payload: string;
}): {
  local_id: string;
  data: Record<string, unknown>;
  version: number;
} {
  return {
    local_id: command.local_id,
    data: {
      id: command.local_id,
      logo_url: `data:image/png;base64,${command.payload}`,
      name: `Team ${command.local_id}`,
    },
    version: TEST_VERSION,
  };
}

describe("syncPushBatching", () => {
  it("splits records into multiple batches when a combined payload is too large", () => {
    const first_record = create_sync_batch_record({
      local_id: "team-1",
      payload: "a".repeat(110),
    });
    const second_record = create_sync_batch_record({
      local_id: "team-2",
      payload: "b".repeat(110),
    });

    const result = build_sync_push_batches({
      table_name: TEST_TABLE_NAME,
      records: [first_record, second_record],
      detect_conflicts: true,
      max_payload_bytes: TEST_PAYLOAD_LIMIT_BYTES,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.batches).toHaveLength(2);
    expect(result.batches[0]).toEqual([first_record]);
    expect(result.batches[1]).toEqual([second_record]);
  });

  it("fails when a single record is too large to fit in one sync payload", () => {
    const oversized_record = create_sync_batch_record({
      local_id: "team-3",
      payload: "c".repeat(320),
    });

    const result = build_sync_push_batches({
      table_name: TEST_TABLE_NAME,
      records: [oversized_record],
      detect_conflicts: true,
      max_payload_bytes: TEST_PAYLOAD_LIMIT_BYTES,
    });

    expect(result.success).toBe(false);
    expect(result.batches).toEqual([]);
    expect(result.error).toContain("team-3");
    expect(result.error).toContain("logo_url");
    expect(result.error).toContain("smaller image");
  });
});
