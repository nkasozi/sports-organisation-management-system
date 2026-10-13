import { describe, expect, it } from "vitest";

import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTypes";

import {
  build_storage_backup_envelope,
  serialize_storage_backup_envelope,
  STORAGE_BACKUP_FORMAT_VERSION,
} from "./storageBackupFormat";
import { parse_storage_backup_envelope_json } from "./storageBackupParsing";

describe("build_storage_backup_envelope", () => {
  it("normalizes snapshots to the canonical table list and records counts", () => {
    const envelope = build_storage_backup_envelope({
      created_at: "2026-05-17T12:00:00.000Z",
      source: "manual_export",
      app_initialized: true,
      seeding_complete: true,
      session_sync_marker_state: {
        status: "present",
        marker: { mode: "verified", session_id: "session-1" },
      },
      table_snapshots: [
        {
          table_name: "teams",
          records: [{ id: "team-1", name: "Cranes" }],
        },
      ],
      sync_bookkeeping: { outbox_entries: [], record_versions: [] },
    });

    expect(envelope.format_version).toBe(STORAGE_BACKUP_FORMAT_VERSION);
    expect(envelope.metadata).toEqual({
      created_at: "2026-05-17T12:00:00.000Z",
      source: "manual_export",
      app_initialized: true,
      seeding_complete: true,
      session_sync_marker_state: {
        status: "present",
        marker: { mode: "verified", session_id: "session-1" },
      },
    });
    expect(envelope.table_snapshots).toHaveLength(TABLE_NAMES.length);
    expect(
      envelope.table_snapshots.find(
        (snapshot) => snapshot.table_name === "teams",
      ),
    ).toEqual({
      table_name: "teams",
      record_count: 1,
      records: [{ id: "team-1", name: "Cranes" }],
    });
    expect(
      envelope.table_snapshots.find(
        (snapshot) => snapshot.table_name === "players",
      ),
    ).toEqual({
      table_name: "players",
      record_count: 0,
      records: [],
    });
  });
});

describe("parse_storage_backup_envelope_json", () => {
  it("round-trips a serialized envelope", () => {
    const serialized = serialize_storage_backup_envelope(
      build_storage_backup_envelope({
        created_at: "2026-05-17T12:00:00.000Z",
        source: "device_automatic",
        app_initialized: true,
        seeding_complete: true,
        session_sync_marker_state: {
          status: "present",
          marker: { mode: "anonymous" },
        },
        table_snapshots: [
          {
            table_name: "teams",
            records: [{ id: "team-1" }],
          },
        ],
        sync_bookkeeping: { outbox_entries: [], record_versions: [] },
      }),
    );

    const result = parse_storage_backup_envelope_json(serialized);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.table_snapshots).toHaveLength(TABLE_NAMES.length);
    expect(
      result.data.table_snapshots.find(
        (snapshot) => snapshot.table_name === "teams",
      )?.record_count,
    ).toBe(1);
  });

  it("rejects unknown tables", () => {
    const result = parse_storage_backup_envelope_json(
      JSON.stringify({
        format_version: STORAGE_BACKUP_FORMAT_VERSION,
        metadata: {
          created_at: "2026-05-17T12:00:00.000Z",
          source: "manual_export",
          app_initialized: true,
          seeding_complete: true,
          session_sync_marker_state: {
            status: "present",
            marker: { mode: "anonymous" },
          },
        },
        table_snapshots: [
          {
            table_name: "unknown_table",
            records: [],
          },
        ],
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Backup contains unknown table names",
    });
  });

  it("rejects malformed JSON and non-object roots", () => {
    for (const serialized of ["{not json", "null", "[]", "42"]) {
      expect(parse_storage_backup_envelope_json(serialized)).toEqual({
        success: false,
        error: "Backup JSON is invalid",
      });
    }
  });

  it("rejects table snapshot entries that are not objects", () => {
    const result = parse_storage_backup_envelope_json(
      JSON.stringify({
        format_version: STORAGE_BACKUP_FORMAT_VERSION,
        metadata: {
          created_at: "2026-05-17T12:00:00.000Z",
          source: "manual_export",
          app_initialized: true,
          seeding_complete: true,
          session_sync_marker_state: { status: "missing" },
        },
        table_snapshots: [null],
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Backup table snapshots are invalid",
    });
  });
});
