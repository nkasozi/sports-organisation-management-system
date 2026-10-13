import { describe, expect, it } from "vitest";

import type { StorageBackupDatabasePort } from "./storageBackupContracts";
import { create_storage_backup_dexie_database_port } from "./storageBackupDexieDatabasePort";
import {
  create_fake_database,
  create_untracked_marker_spy,
  EMPTY_SYNC_BOOKKEEPING,
} from "./storageBackupDexieDatabasePortTestSupport";

const pending_outbox_entry = {
  table_name: "teams",
  local_id: "team-1",
  operation: "upsert" as const,
  base_version: { kind: "known" as const, version: 3 },
  change_token: "token-1",
  enqueued_at: "2026-05-17T12:00:00.000Z",
  status: "pending" as const,
};

function create_port_harness(): {
  harness: ReturnType<typeof create_fake_database>;
  port: StorageBackupDatabasePort;
} {
  const harness = create_fake_database();
  const port = create_storage_backup_dexie_database_port(
    () => harness.database,
    create_untracked_marker_spy(harness.call_order),
  );
  return { harness, port };
}

describe("storage backup Dexie port sync bookkeeping", () => {
  it("restores outbox entries and known versions in the same transaction and leaves cursors empty", async () => {
    const { harness, port } = create_port_harness();

    const result = await port.replace_all_tables_atomically({
      table_snapshots: [{ table_name: "teams", records: [{ id: "team-1" }] }],
      sync_bookkeeping: {
        outbox_entries: [pending_outbox_entry],
        record_versions: [
          { table_name: "teams", local_id: "team-1", server_version: 3 },
        ],
      },
      persist_settings_within_transaction: async () => true,
    });

    expect(result).toEqual({ success: true, data: true });
    const writes = harness.call_order.filter((call) =>
      call.startsWith("bulk_put:"),
    );
    expect(writes).toEqual([
      "bulk_put:teams:1",
      "bulk_put:sync_outbox:1",
      "bulk_put:sync_record_versions:1",
    ]);
    expect(harness.call_order).toContain("raw_clear:sync_cursors");
    expect(harness.call_order.at(-1)).toBe("transaction_committed");
  });

  it("exports the outbox and known record versions", async () => {
    const { port } = create_port_harness();

    expect(await port.export_sync_bookkeeping()).toEqual({
      outbox_entries: [{ id: "sync_outbox-1" }],
      record_versions: [{ id: "sync_record_versions-1" }],
    });
  });

  it("rolls the restore back when the settings cannot be persisted", async () => {
    const { harness, port } = create_port_harness();

    const result = await port.replace_all_tables_atomically({
      table_snapshots: [],
      sync_bookkeeping: EMPTY_SYNC_BOOKKEEPING,
      persist_settings_within_transaction: async () => false,
    });

    expect(result.success).toBe(false);
    expect(harness.call_order).not.toContain("transaction_committed");
  });
});
