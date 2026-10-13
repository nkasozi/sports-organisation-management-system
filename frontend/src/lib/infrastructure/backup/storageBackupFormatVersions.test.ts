import { describe, expect, it } from "vitest";

import {
  build_storage_backup_envelope,
  LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
  serialize_storage_backup_envelope,
  STORAGE_BACKUP_FORMAT_VERSION,
} from "./storageBackupFormat";
import { parse_storage_backup_envelope_json } from "./storageBackupParsing";
import { resolve_restorable_sync_bookkeeping } from "./storageBackupSyncBookkeepingRestore";

const metadata = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "manual_export" as const,
  app_initialized: true,
  seeding_complete: true,
  session_sync_marker_state: {
    status: "present" as const,
    marker: { mode: "anonymous" as const },
  },
};

const sync_bookkeeping = {
  outbox_entries: [
    {
      table_name: "teams",
      local_id: "team-1",
      operation: "upsert" as const,
      base_version: { kind: "known" as const, version: 2 },
      change_token: "token-1",
      enqueued_at: "2026-05-17T11:59:00.000Z",
      status: "rejected" as const,
      rejection_code: "forbidden",
      rejection_message: "Not allowed",
    },
  ],
  record_versions: [
    { table_name: "teams", local_id: "team-1", server_version: 2 },
  ],
};

describe("storage backup format versions", () => {
  it("writes the current format with sync bookkeeping and reads it back unchanged", () => {
    const serialized = serialize_storage_backup_envelope(
      build_storage_backup_envelope({
        ...metadata,
        table_snapshots: [{ table_name: "teams", records: [{ id: "team-1" }] }],
        sync_bookkeeping,
      }),
    );

    const result = parse_storage_backup_envelope_json(serialized);

    expect(STORAGE_BACKUP_FORMAT_VERSION).toBe(2);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.format_version).toBe(STORAGE_BACKUP_FORMAT_VERSION);
    expect(resolve_restorable_sync_bookkeeping(result.data)).toEqual(
      sync_bookkeeping,
    );
  });

  it("still reads legacy version 1 backups as an explicit legacy variant without bookkeeping", () => {
    const legacy_backup = JSON.stringify({
      format_version: LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
      metadata,
      table_snapshots: [{ table_name: "teams", records: [{ id: "team-1" }] }],
    });

    const result = parse_storage_backup_envelope_json(legacy_backup);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.format_version).toBe(
      LEGACY_STORAGE_BACKUP_FORMAT_VERSION,
    );
    expect(resolve_restorable_sync_bookkeeping(result.data)).toEqual({
      outbox_entries: [],
      record_versions: [],
    });
  });

  it("rejects a current-format backup whose bookkeeping is missing or malformed", () => {
    const current_format_fields = {
      format_version: STORAGE_BACKUP_FORMAT_VERSION,
      metadata,
      table_snapshots: [],
    };
    for (const broken_backup of [
      current_format_fields,
      {
        ...current_format_fields,
        sync_bookkeeping: {
          outbox_entries: [{ table_name: "teams" }],
          record_versions: [],
        },
      },
    ]) {
      const result = parse_storage_backup_envelope_json(
        JSON.stringify(broken_backup),
      );

      expect(result.success).toBe(false);
    }
  });

  it("rejects unknown future versions", () => {
    const result = parse_storage_backup_envelope_json(
      JSON.stringify({ format_version: 3, metadata, table_snapshots: [] }),
    );

    expect(result).toEqual({
      success: false,
      error: "Backup format version is unsupported",
    });
  });
});
