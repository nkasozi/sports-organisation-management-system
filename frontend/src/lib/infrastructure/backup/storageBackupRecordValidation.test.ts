import { describe, expect, it } from "vitest";

import type { StorageBackupTableSnapshot } from "./storageBackupFormat";
import {
  MAXIMUM_STORAGE_BACKUP_TOTAL_RECORDS,
  validate_storage_backup_table_snapshots,
} from "./storageBackupRecordValidation";

function build_snapshot(
  table_name: StorageBackupTableSnapshot["table_name"],
  records: unknown[],
): StorageBackupTableSnapshot {
  return {
    table_name,
    record_count: records.length,
    records: records as Record<string, unknown>[],
  };
}

describe("validate_storage_backup_table_snapshots", () => {
  it("accepts records that all carry unique non-empty string ids", () => {
    const result = validate_storage_backup_table_snapshots([
      build_snapshot("teams", [
        { id: "team-1", name: "Cranes" },
        { id: "team-2", name: "Kobs" },
      ]),
      build_snapshot("players", []),
    ]);

    expect(result).toEqual({
      success: true,
      data: [
        {
          table_name: "teams",
          records: [
            { id: "team-1", name: "Cranes" },
            { id: "team-2", name: "Kobs" },
          ],
        },
        { table_name: "players", records: [] },
      ],
    });
  });

  it("allows the same id to appear in different tables", () => {
    const result = validate_storage_backup_table_snapshots([
      build_snapshot("teams", [{ id: "shared-1" }]),
      build_snapshot("players", [{ id: "shared-1" }]),
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects a record without an id", () => {
    const result = validate_storage_backup_table_snapshots([
      build_snapshot("teams", [{ id: "team-1" }, { name: "No id" }]),
    ]);

    expect(result).toEqual({
      success: false,
      error: "Backup contains a record without a valid id (teams)",
    });
  });

  it("rejects a record whose id is empty or whitespace", () => {
    expect(
      validate_storage_backup_table_snapshots([
        build_snapshot("teams", [{ id: "" }]),
      ]),
    ).toEqual({
      success: false,
      error: "Backup contains a record without a valid id (teams)",
    });
    expect(
      validate_storage_backup_table_snapshots([
        build_snapshot("teams", [{ id: "   " }]),
      ]),
    ).toEqual({
      success: false,
      error: "Backup contains a record without a valid id (teams)",
    });
  });

  it("rejects a record whose id is not a string", () => {
    const result = validate_storage_backup_table_snapshots([
      build_snapshot("players", [{ id: 42 }]),
    ]);

    expect(result).toEqual({
      success: false,
      error: "Backup contains a record without a valid id (players)",
    });
  });

  it("rejects records that are not plain objects", () => {
    for (const invalid_record of [null, "team-1", 7, ["team-1"]]) {
      expect(
        validate_storage_backup_table_snapshots([
          build_snapshot("teams", [invalid_record]),
        ]),
      ).toEqual({
        success: false,
        error: "Backup contains a record that is not an object (teams)",
      });
    }
  });

  it("rejects duplicate ids within one table", () => {
    const result = validate_storage_backup_table_snapshots([
      build_snapshot("teams", [{ id: "team-1" }, { id: "team-1" }]),
    ]);

    expect(result).toEqual({
      success: false,
      error: "Backup contains duplicate record ids (teams)",
    });
  });

  it("rejects backups above the maximum supported record count before inspecting records", () => {
    const oversized_records = new Array(
      MAXIMUM_STORAGE_BACKUP_TOTAL_RECORDS + 1,
    ).fill({ name: "missing id" });

    const result = validate_storage_backup_table_snapshots([
      build_snapshot("teams", oversized_records),
    ]);

    expect(result).toEqual({
      success: false,
      error: "Backup exceeds the maximum supported record count",
    });
  });
});
