import { afterEach, describe, expect, it } from "vitest";

import { summarize_outbox } from "$lib/infrastructure/sync/syncOutboxRepository";

import type { SportSyncDatabase } from "../database";
import {
  open_real_test_database,
  read_real_outbox_ids,
} from "./realDexieDatabase.test_support";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "./syncChangeTrackingGate";
import { sync_local_change_notifier } from "./syncLocalChangeNotifier";
import { run_untracked_write_scope } from "./untrackedWriteScope";

const opened_databases: SportSyncDatabase[] = [];

function open_database(): SportSyncDatabase {
  const database = open_real_test_database();
  opened_databases.push(database);
  return database;
}

afterEach(async () => {
  sync_local_change_notifier.set_listener(() => false);
  for (const database of opened_databases.splice(0)) await database.delete();
});

describe("sync outbox middleware on a real Dexie database", () => {
  it("records table.update() and collection.modify() as pending upserts", async () => {
    const database = open_database();
    await database.table("teams").bulkPut([
      { id: "team_updated", name: "A" },
      { id: "team_modified", name: "B" },
    ]);
    await database.table("sync_outbox").clear();

    await database.table("teams").update("team_updated", { name: "A2" });
    await database
      .table("teams")
      .where("id")
      .equals("team_modified")
      .modify({ name: "B2" });

    expect(await read_real_outbox_ids(database)).toEqual([
      "teams:team_modified",
      "teams:team_updated",
    ]);
  });

  it("records bulkUpdate() for each existing record", async () => {
    const database = open_database();
    await database.table("teams").put({ id: "team_bulk", name: "A" });
    await database.table("sync_outbox").clear();

    await database
      .table("teams")
      .bulkUpdate([{ key: "team_bulk", changes: { name: "B" } }]);

    expect(await read_real_outbox_ids(database)).toEqual(["teams:team_bulk"]);
  });

  it("does not record writes in a transaction marked as untracked", async () => {
    const database = open_database();

    await database.transaction("rw", ["teams"], async (transaction) => {
      sync_change_tracking_gate.mark_untracked_transaction(
        transaction.idbtrans,
        UntrackedWriteReason.BACKUP_RESTORE,
      );
      await database.table("teams").put({ id: "team_restored" });
    });

    expect(await read_real_outbox_ids(database)).toEqual([]);
  });

  it("still records raw writes made while an untracked scope is open", async () => {
    const database = open_database();

    const result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DATA_RESET,
      async () => {
        await database.table("teams").put({ id: "team_seeded" });
        await database.table("teams").update("team_seeded", { name: "Seed" });
        return true;
      },
    );
    await database.table("players").put({ id: "player_after_reset" });

    expect(result).toEqual({ success: true, data: true });
    expect(await read_real_outbox_ids(database)).toEqual([
      "players:player_after_reset",
      "teams:team_seeded",
    ]);
  });

  it("notifies listeners outside the writing transaction so they can read the outbox", async () => {
    const database = open_database();
    const observed_pending_counts: number[] = [];
    const listener_finished = new Promise<boolean>((resolve) =>
      sync_local_change_notifier.set_listener((table_name: string) => {
        if (table_name !== "organizations") return false;
        void summarize_outbox(database).then(
          (summary) => {
            observed_pending_counts.push(summary.pending_count);
            resolve(true);
          },
          () => resolve(false),
        );
        return true;
      }),
    );

    await database.transaction("rw", ["organizations"], async () => {
      await database.table("organizations").put({ id: "organization_new" });
    });

    expect(await listener_finished).toBe(true);
    expect(observed_pending_counts).toEqual([1]);
  });
});
