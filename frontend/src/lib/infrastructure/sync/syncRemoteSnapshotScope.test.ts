import { afterEach, describe, expect, it } from "vitest";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import { open_real_test_database } from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { read_sync_cursor } from "./syncOutboxRepository";
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

const FULL_PRIVATE_TEAM = {
  id: "team_a",
  name: "Alpha",
  contact_email: "private@example.test",
};

async function seed_full_team(
  dependencies: ReturnType<typeof open_dependencies>,
  version: number,
): Promise<void> {
  await apply_remote_change_page(dependencies, {
    table_name: "teams",
    records: [
      {
        local_id: "team_a",
        server_version: version,
        server_sequence: 0,
        local_data: FULL_PRIVATE_TEAM,
      },
    ],
    deletions: [],
    next_cursor: 20,
  });
}

describe("remote snapshot scopes", () => {
  it("never replaces a full local record with a public projection of the same version", async () => {
    const dependencies = open_dependencies();
    await seed_full_team(dependencies, 3);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [{ local_id: "team_a", version: 3, name: "Alpha" }],
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );

    expect(await dependencies.database.table("teams").get("team_a")).toEqual(
      FULL_PRIVATE_TEAM,
    );
  });

  it("merges only the projected fields of a newer public projection", async () => {
    const dependencies = open_dependencies();
    await seed_full_team(dependencies, 3);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [{ local_id: "team_a", version: 4, name: "Renamed" }],
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );

    expect(await dependencies.database.table("teams").get("team_a")).toEqual({
      ...FULL_PRIVATE_TEAM,
      name: "Renamed",
    });
  });

  it("never moves the change cursor for any snapshot scope", async () => {
    const dependencies = open_dependencies();
    await seed_full_team(dependencies, 3);
    const sequenced = [
      { local_id: "team_b", version: 1, sync_sequence: 90, name: "Beta" },
    ];

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      sequenced,
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );
    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      sequenced,
      SnapshotRecordScope.FULL_RECORDS,
    );

    expect(await read_sync_cursor(dependencies.database, "teams")).toBe(20);
  });

  it("does not create a cursor row for a table that was never pulled", async () => {
    const dependencies = open_dependencies();

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [{ local_id: "team_b", version: 1, sync_sequence: 90, name: "Beta" }],
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );

    expect(await dependencies.database.table("sync_cursors").count()).toBe(0);
    expect(
      await dependencies.database.table("teams").get("team_b"),
    ).toMatchObject({ name: "Beta" });
  });

  it("replaces the local record with a full snapshot of a newer version", async () => {
    const dependencies = open_dependencies();
    await seed_full_team(dependencies, 3);

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [{ local_id: "team_a", version: 4, name: "Full" }],
      SnapshotRecordScope.FULL_RECORDS,
    );

    expect(await dependencies.database.table("teams").get("team_a")).toEqual({
      id: "team_a",
      name: "Full",
    });
  });
});
