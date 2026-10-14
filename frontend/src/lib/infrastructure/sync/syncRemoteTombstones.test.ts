import { afterEach, describe, expect, it } from "vitest";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  open_real_test_database,
  read_real_outbox,
} from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { confirm_outbox_entry } from "./syncOutboxEntryUpdates";
import { apply_remote_change_page } from "./syncRemoteApply";
import {
  apply_remote_snapshot_records,
  SnapshotRecordScope,
} from "./syncRemoteApplyRecords";

const opened_databases: SportSyncDatabase[] = [];

function open_dependencies(): {
  database: SportSyncDatabase;
  gate: typeof sync_change_tracking_gate;
} {
  const database = open_real_test_database();
  opened_databases.push(database);
  return { database, gate: sync_change_tracking_gate };
}

afterEach(async () => {
  for (const database of opened_databases.splice(0)) await database.delete();
});

async function apply_live_then_tombstone(
  dependencies: ReturnType<typeof open_dependencies>,
): Promise<void> {
  await apply_remote_change_page(dependencies, {
    table_name: "teams",
    records: [
      {
        local_id: "team_a",
        server_version: 3,
        server_sequence: 0,
        local_data: { id: "team_a", name: "Alpha" },
      },
    ],
    deletions: [],
    next_cursor: 10,
  });
  await apply_remote_change_page(dependencies, {
    table_name: "teams",
    records: [],
    deletions: [{ local_id: "team_a", server_version: 4, server_sequence: 0 }],
    next_cursor: 11,
  });
}

const STALE_SERVER_RECORD = { local_id: "team_a", version: 3, name: "Alpha" };

describe("remote deletions leave a local tombstone", () => {
  it("does not let a stale full snapshot re-insert a remotely deleted record", async () => {
    const dependencies = open_dependencies();
    await apply_live_then_tombstone(dependencies);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [STALE_SERVER_RECORD],
      SnapshotRecordScope.FULL_RECORDS,
    );

    expect(await dependencies.database.table("teams").get("team_a")).toBe(
      undefined,
    );
  });

  it("does not let a stale public snapshot re-insert a remotely deleted record", async () => {
    const dependencies = open_dependencies();
    await apply_live_then_tombstone(dependencies);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [STALE_SERVER_RECORD],
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );

    expect(await dependencies.database.table("teams").get("team_a")).toBe(
      undefined,
    );
  });

  it("does not let a stale change page re-insert a remotely deleted record", async () => {
    const dependencies = open_dependencies();
    await apply_live_then_tombstone(dependencies);

    const summary = await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [
        {
          local_id: "team_a",
          server_version: 3,
          server_sequence: 0,
          local_data: { id: "team_a", name: "Alpha" },
        },
      ],
      deletions: [],
      next_cursor: 5,
    });

    expect(summary.applied_count).toBe(0);
    expect(await dependencies.database.table("teams").get("team_a")).toBe(
      undefined,
    );
  });

  it("applies a record recreated on the server with a newer version", async () => {
    const dependencies = open_dependencies();
    await apply_live_then_tombstone(dependencies);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [{ local_id: "team_a", version: 5, name: "Reborn" }],
      SnapshotRecordScope.FULL_RECORDS,
    );

    expect(
      await dependencies.database.table("teams").get("team_a"),
    ).toMatchObject({ name: "Reborn" });
  });

  it("keeps a tombstone after a confirmed local delete so stale snapshots cannot resurrect it", async () => {
    const dependencies = open_dependencies();
    const database = dependencies.database;
    await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [
        {
          local_id: "team_a",
          server_version: 3,
          server_sequence: 0,
          local_data: { id: "team_a", name: "Alpha" },
        },
      ],
      deletions: [],
      next_cursor: 10,
    });
    await database.table("teams").delete("team_a");
    const [delete_entry] = await read_real_outbox(database);

    await confirm_outbox_entry(database, delete_entry, 0);
    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [STALE_SERVER_RECORD],
      SnapshotRecordScope.FULL_RECORDS,
    );

    expect(await database.table("teams").get("team_a")).toBe(undefined);
  });

  it("treats a locally recreated record over a tombstone as having no known base version", async () => {
    const dependencies = open_dependencies();
    await apply_live_then_tombstone(dependencies);

    await dependencies.database
      .table("teams")
      .put({ id: "team_a", name: "Again" });
    const [entry] = await read_real_outbox(dependencies.database);

    expect(entry.base_version).toEqual({ kind: "unknown" });
  });
});
