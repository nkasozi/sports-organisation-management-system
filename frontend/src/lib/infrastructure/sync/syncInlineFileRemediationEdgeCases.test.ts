import { describe, expect, it } from "vitest";

import { DEFAULT_PLAYER_AVATAR } from "$lib/core/entities/Player";

import {
  build_remediated_sync_records,
  type SyncRemediableRecord,
} from "./syncInlineFileRemediation";
import { EPOCH_TIMESTAMP } from "./syncTypes";

const TEST_PAYLOAD_LIMIT_BYTES = 420;
const TEST_UPDATED_AT = "2024-05-02T10:00:00.000Z";

function build_records_for(
  table_name: "players" | "fixtures" | "teams",
  record: SyncRemediableRecord,
  max_payload_bytes: number = TEST_PAYLOAD_LIMIT_BYTES,
): ReturnType<typeof build_remediated_sync_records> {
  return build_remediated_sync_records({
    table_name,
    all_local_records: [record],
    remote_latest_modified_at: EPOCH_TIMESTAMP,
    detect_conflicts: true,
    max_payload_bytes,
  });
}

describe("syncInlineFileRemediation edge cases", () => {
  it("keeps the same record instance when it already fits", () => {
    const record = {
      id: "player-1",
      profile_image_url: "data:image/png;base64,abc",
      updated_at: TEST_UPDATED_AT,
    } as SyncRemediableRecord;

    const result = build_records_for("players", record);

    expect(result.records[0]).toBe(record);
    expect(result.remediated_records).toEqual([]);
  });

  it("does not change oversized records on tables without file fallbacks", () => {
    const record = {
      id: "fixture-1",
      notes: `data:image/png;base64,${"x".repeat(400)}`,
      updated_at: TEST_UPDATED_AT,
    } as SyncRemediableRecord;

    const result = build_records_for("fixtures", record);

    expect(result.records[0]).toBe(record);
    expect(result.remediated_record_ids).toEqual([]);
  });

  it("does not change oversized records whose file field is not inline data", () => {
    const record = {
      id: "player-2",
      profile_image_url: `https://example.com/${"y".repeat(400)}`,
      updated_at: TEST_UPDATED_AT,
    } as SyncRemediableRecord;

    const result = build_records_for("players", record);

    expect(result.records[0]).toBe(record);
    expect(result.remediated_record_ids).toEqual([]);
  });

  it("returns the replaced record even when it still does not fit", () => {
    const record = {
      id: "player-3",
      profile_image_url: `data:image/png;base64,${"z".repeat(400)}`,
      biography: "b".repeat(600),
      updated_at: TEST_UPDATED_AT,
    } as SyncRemediableRecord;

    const result = build_records_for("players", record);

    expect(result.remediated_record_ids).toEqual(["player-3"]);
    expect(result.records[0]).not.toBe(record);
    expect(result.records[0].profile_image_url).toBe(DEFAULT_PLAYER_AVATAR);
    expect(result.records[0].biography).toBe(record.biography);
  });
});
