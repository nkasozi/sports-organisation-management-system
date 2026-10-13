import { describe, expect, it } from "vitest";

import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTypes";

import { create_storage_backup_dexie_database_port } from "./storageBackupDexieDatabasePort";
import {
  create_fake_database,
  create_untracked_marker_spy,
  EMPTY_SYNC_BOOKKEEPING,
} from "./storageBackupDexieDatabasePortTestSupport";

describe("create_storage_backup_dexie_database_port", () => {
  it("clears and rewrites every table, resets pull cursors and known versions, inside one read-write transaction", async () => {
    const harness = create_fake_database();
    const port = create_storage_backup_dexie_database_port(
      () => harness.database,
      create_untracked_marker_spy(harness.call_order),
    );

    const result = await port.replace_all_tables_atomically({
      table_snapshots: [
        { table_name: "teams", records: [{ id: "team-1" }, { id: "team-2" }] },
        { table_name: "players", records: [] },
      ],
      sync_bookkeeping: EMPTY_SYNC_BOOKKEEPING,
      persist_settings_within_transaction: async () => {
        harness.call_order.push("persist_settings");
        return true;
      },
    });

    expect(result).toEqual({ success: true, data: true });
    const cleared_tables = [
      ...TABLE_NAMES,
      "sync_outbox",
      "sync_record_versions",
      "sync_cursors",
    ];
    expect(harness.transaction_requests).toEqual([
      { mode: "rw", table_names: [...cleared_tables, "app_settings"] },
    ]);
    expect(harness.call_order.slice(0, 2)).toEqual([
      "transaction_started",
      "marked_untracked",
    ]);
    expect(harness.call_order.slice(2, cleared_tables.length + 2)).toEqual(
      cleared_tables.map((table_name) => `raw_clear:${table_name}`),
    );
    expect(harness.call_order.slice(cleared_tables.length + 2)).toEqual([
      "bulk_put:teams:2",
      "persist_settings",
      "transaction_committed",
    ]);
  });

  it("never uses the hooked Dexie clear so deleting hooks cannot fire remote deletes", async () => {
    const harness = create_fake_database();
    const port = create_storage_backup_dexie_database_port(
      () => harness.database,
      create_untracked_marker_spy(harness.call_order),
    );

    expect(
      (
        await port.replace_all_tables_atomically({
          table_snapshots: [
            { table_name: "teams", records: [{ id: "team-1" }] },
          ],
          sync_bookkeeping: EMPTY_SYNC_BOOKKEEPING,
          persist_settings_within_transaction: async () => true,
        })
      ).success,
    ).toBe(true);

    expect(
      harness.call_order.filter((call) => call.startsWith("dexie_clear:")),
    ).toEqual([]);
  });

  it("marks the restore transaction itself as untracked so restored records are never queued for push", async () => {
    const harness = create_fake_database();
    const marked_transactions: object[] = [];
    const port = create_storage_backup_dexie_database_port(
      () => harness.database,
      (low_level_transaction: object): boolean => {
        marked_transactions.push(low_level_transaction);
        return true;
      },
    );

    expect(
      (
        await port.replace_all_tables_atomically({
          table_snapshots: [
            { table_name: "teams", records: [{ id: "team-1" }] },
          ],
          sync_bookkeeping: EMPTY_SYNC_BOOKKEEPING,
          persist_settings_within_transaction: async () => true,
        })
      ).success,
    ).toBe(true);

    expect(marked_transactions).toEqual([harness.low_level_transaction]);
  });

  it("returns a failure when any write inside the transaction fails", async () => {
    const harness = create_fake_database("teams");
    const port = create_storage_backup_dexie_database_port(
      () => harness.database,
      create_untracked_marker_spy(harness.call_order),
    );

    const result = await port.replace_all_tables_atomically({
      table_snapshots: [{ table_name: "teams", records: [{ id: "team-1" }] }],
      sync_bookkeeping: EMPTY_SYNC_BOOKKEEPING,
      persist_settings_within_transaction: async () => true,
    });

    expect(result).toEqual({ success: false, error: "Error: ConstraintError" });
    expect(harness.call_order).not.toContain("transaction_committed");
  });

  it("exports every table and counts every record", async () => {
    const harness = create_fake_database();
    const port = create_storage_backup_dexie_database_port(
      () => harness.database,
      create_untracked_marker_spy(harness.call_order),
    );

    const snapshots = await port.export_table_snapshots();

    expect(snapshots).toHaveLength(TABLE_NAMES.length);
    expect(snapshots[0]).toEqual({
      table_name: TABLE_NAMES[0],
      records: [{ id: `${TABLE_NAMES[0]}-1` }],
    });
    expect(await port.get_total_record_count()).toBe(TABLE_NAMES.length * 2);
  });
});
