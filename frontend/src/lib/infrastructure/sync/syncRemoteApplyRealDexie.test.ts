import { afterEach, describe, expect, it } from "vitest";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  open_real_test_database,
  read_real_outbox_ids,
} from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { read_sync_cursor } from "./syncOutboxRepository";
import { apply_remote_change_page } from "./syncRemoteApply";

const opened_databases: SportSyncDatabase[] = [];

function open_database(): SportSyncDatabase {
  const database = open_real_test_database();
  opened_databases.push(database);
  return database;
}

function build_page(
  version: number,
  name: string,
  next_cursor: number,
): Parameters<typeof apply_remote_change_page>[1] {
  return {
    table_name: "teams",
    records: [
      {
        local_id: "team_remote",
        server_version: version,
        server_sequence: 0,
        local_data: { id: "team_remote", name },
      },
    ],
    deletions: [],
    next_cursor,
  };
}

afterEach(async () => {
  for (const database of opened_databases.splice(0)) await database.delete();
});

describe("remote apply on a real Dexie database", () => {
  it("writes records, versions and the cursor together without creating outbox entries", async () => {
    const database = open_database();
    const dependencies = { database, gate: sync_change_tracking_gate };

    await apply_remote_change_page(dependencies, build_page(3, "Remote", 40));

    expect(await database.table("teams").get("team_remote")).toEqual({
      id: "team_remote",
      name: "Remote",
    });
    expect(
      await database
        .table("sync_record_versions")
        .get(["teams", "team_remote"]),
    ).toMatchObject({ server_version: 3 });
    expect(await read_sync_cursor(database, "teams")).toBe(40);
    expect(await read_real_outbox_ids(database)).toEqual([]);
  });

  it("rolls back the whole page and keeps the cursor when one write fails", async () => {
    const database = open_database();
    const dependencies = { database, gate: sync_change_tracking_gate };
    const valid_page = build_page(3, "Remote", 40);
    const failing_page = {
      ...valid_page,
      records: [
        ...valid_page.records,
        {
          local_id: "team_broken",
          server_version: 1,
          server_sequence: 0,
          local_data: {},
        },
      ],
    };

    const outcome = await apply_remote_change_page(
      dependencies,
      failing_page,
    ).then(
      () => "applied",
      () => "rejected",
    );

    expect(outcome).toBe("rejected");
    expect(await database.table("teams").get("team_remote")).toBe(undefined);
    expect(await read_sync_cursor(database, "teams")).toBe(0);
  });

  it("never regresses a record to an older server version", async () => {
    const database = open_database();
    const dependencies = { database, gate: sync_change_tracking_gate };

    await apply_remote_change_page(dependencies, build_page(5, "Newer", 50));
    const summary = await apply_remote_change_page(
      dependencies,
      build_page(4, "Older", 45),
    );

    expect(summary.applied_count).toBe(0);
    expect(await database.table("teams").get("team_remote")).toEqual({
      id: "team_remote",
      name: "Newer",
    });
    expect(await read_sync_cursor(database, "teams")).toBe(50);
  });
});
