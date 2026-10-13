import { describe, expect, it } from "vitest";

import { parse_storage_backup_sync_bookkeeping } from "./storageBackupSyncBookkeeping";

const pending_entry = {
  table_name: "teams",
  local_id: "team-1",
  operation: "upsert",
  base_version: { kind: "known", version: 4 },
  change_token: "token-1",
  enqueued_at: "2026-05-17T12:00:00.000Z",
  status: "pending",
};

const rejected_entry = {
  ...pending_entry,
  local_id: "team-2",
  base_version: { kind: "unknown" },
  status: "rejected",
  rejection_code: "forbidden",
  rejection_message: "Not allowed",
};

const conflicted_entry = {
  ...pending_entry,
  local_id: "team-3",
  operation: "delete",
  status: "conflicted",
  remote_version: 9,
};

const record_version = {
  table_name: "teams",
  local_id: "team-1",
  server_version: 4,
};

function parse(
  outbox_entries: unknown[],
  record_versions: unknown[] = [],
): ReturnType<typeof parse_storage_backup_sync_bookkeeping> {
  return parse_storage_backup_sync_bookkeeping({
    outbox_entries,
    record_versions,
  });
}

describe("parse_storage_backup_sync_bookkeeping", () => {
  it("keeps every outbox entry with its original status and fields", () => {
    expect(
      parse(
        [pending_entry, rejected_entry, conflicted_entry],
        [record_version],
      ),
    ).toEqual({
      success: true,
      data: {
        outbox_entries: [pending_entry, rejected_entry, conflicted_entry],
        record_versions: [record_version],
      },
    });
  });

  it("keeps entries whose base version asks for a recreate", () => {
    const recreate_entry = {
      ...pending_entry,
      local_id: "team-4",
      base_version: { kind: "recreate" },
    };

    expect(parse([recreate_entry])).toEqual({
      success: true,
      data: { outbox_entries: [recreate_entry], record_versions: [] },
    });
  });

  it("drops unknown fields from entries", () => {
    const result = parse([{ ...pending_entry, injected: "value" }]);

    expect(result.success && result.data.outbox_entries[0]).toEqual(
      pending_entry,
    );
  });

  it.each([
    ["an unknown table", { ...pending_entry, table_name: "secrets" }],
    ["an empty local id", { ...pending_entry, local_id: "" }],
    ["an unknown operation", { ...pending_entry, operation: "merge" }],
    ["an unknown status", { ...pending_entry, status: "sent" }],
    [
      "a malformed base version",
      { ...pending_entry, base_version: { kind: "known" } },
    ],
    [
      "a rejected entry without a code",
      { ...rejected_entry, rejection_code: 7 },
    ],
    [
      "a conflicted entry without a remote version",
      { ...conflicted_entry, remote_version: "9" },
    ],
  ])("rejects an outbox entry with %s", (_label, entry) => {
    expect(parse([entry]).success).toBe(false);
  });

  it("rejects duplicate outbox keys and duplicate record versions", () => {
    expect(parse([pending_entry, pending_entry]).success).toBe(false);
    expect(parse([], [record_version, record_version]).success).toBe(false);
  });

  it("rejects malformed record versions and non-array sections", () => {
    expect(
      parse([], [{ ...record_version, server_version: Number.NaN }]).success,
    ).toBe(false);
    expect(
      parse_storage_backup_sync_bookkeeping({
        outbox_entries: {},
        record_versions: [],
      }).success,
    ).toBe(false);
    expect(parse_storage_backup_sync_bookkeeping("nope").success).toBe(false);
  });
});
