import { afterEach, describe, expect, it } from "vitest";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import { open_real_test_database } from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import { confirm_outbox_entry } from "./syncOutboxEntryUpdates";
import { apply_remote_change_page } from "./syncRemoteApply";

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

function apply_tombstone(
  dependencies: ReturnType<typeof open_dependencies>,
  server_sequence: number,
): Promise<unknown> {
  return apply_remote_change_page(dependencies, {
    table_name: "teams",
    records: [],
    deletions: [{ local_id: "team_a", server_version: 4, server_sequence }],
    next_cursor: server_sequence,
  });
}

function apply_record(
  dependencies: ReturnType<typeof open_dependencies>,
  change: { server_version: number; server_sequence: number },
): Promise<unknown> {
  return apply_remote_change_page(dependencies, {
    table_name: "teams",
    records: [
      {
        local_id: "team_a",
        ...change,
        local_data: { id: "team_a", name: "Reborn" },
      },
    ],
    deletions: [],
    next_cursor: change.server_sequence,
  });
}

describe("records re-created on the server after tombstone pruning", () => {
  it("accepts a re-inserted record whose sync sequence is newer than the local tombstone", async () => {
    const dependencies = open_dependencies();
    await apply_tombstone(dependencies, 11);

    await apply_record(dependencies, {
      server_version: 1,
      server_sequence: 20,
    });

    expect(await dependencies.database.table("teams").toArray()).toEqual([
      { id: "team_a", name: "Reborn" },
    ]);
  });

  it("still ignores an older record that predates the local tombstone", async () => {
    const dependencies = open_dependencies();
    await apply_tombstone(dependencies, 11);

    await apply_record(dependencies, { server_version: 3, server_sequence: 5 });

    expect(await dependencies.database.table("teams").toArray()).toEqual([]);
  });

  it("learns the sequence of this device's own confirmed delete from the change feed", async () => {
    const dependencies = open_dependencies();
    const own_delete = {
      table_name: "teams",
      local_id: "team_a",
      operation: "delete",
      base_version: { kind: "known", version: 3 },
      change_token: "token_1",
      enqueued_at: "2024-01-01T00:00:00.000Z",
      status: "pending",
    } as const;
    await dependencies.database.table("sync_outbox").put(own_delete);
    await confirm_outbox_entry(dependencies.database, own_delete, 4);
    await apply_tombstone(dependencies, 11);

    await apply_record(dependencies, {
      server_version: 1,
      server_sequence: 20,
    });

    expect(await dependencies.database.table("teams").toArray()).toEqual([
      { id: "team_a", name: "Reborn" },
    ]);
  });
});
