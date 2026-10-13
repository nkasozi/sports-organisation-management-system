import { describe, expect, it } from "vitest";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import {
  confirm_outbox_entry,
  mark_outbox_entry_conflicted,
  mark_outbox_entry_rejected,
} from "./syncOutboxEntryUpdates";
import {
  count_unsynced_changes,
  list_pending_entries_for_table,
  list_tables_with_pending_entries,
  read_sync_cursor,
  summarize_outbox,
} from "./syncOutboxRepository";
import { enqueue_local_snapshot } from "./syncOutboxSnapshot";

function build_entry(overrides: Record<string, unknown> = {}): never {
  return {
    table_name: "teams",
    local_id: "team_a",
    operation: "upsert",
    base_version: { kind: "unknown" },
    change_token: "token_1",
    enqueued_at: "2024-01-01T00:00:00.000Z",
    status: "pending",
    ...overrides,
  } as never;
}

describe("sync outbox repository", () => {
  it("removes a confirmed entry and records the server version", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [build_entry()]);
    expect(await confirm_outbox_entry(fake.database, build_entry(), 3)).toBe(
      true,
    );
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([
      { table_name: "teams", local_id: "team_a", server_version: 3 },
    ]);
  });

  it("keeps a newer local edit pending but rebases it on the confirmed version", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [build_entry({ change_token: "token_2" })]);
    expect(await confirm_outbox_entry(fake.database, build_entry(), 3)).toBe(
      false,
    );
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      change_token: "token_2",
      status: "pending",
      base_version: { kind: "known", version: 3 },
    });
  });

  it("forgets the known version once a delete is confirmed", async () => {
    const fake = create_fake_sync_database();
    const delete_entry = build_entry({ operation: "delete" });
    fake.seed("sync_outbox", [delete_entry]);
    fake.seed("sync_record_versions", [
      { table_name: "teams", local_id: "team_a", server_version: 2 },
    ]);
    await confirm_outbox_entry(fake.database, delete_entry, 3);
    expect(fake.rows("sync_record_versions")).toEqual([]);
  });

  it("keeps rejected and conflicted entries visible in the summary", async () => {
    const fake = create_fake_sync_database();
    const second = build_entry({ local_id: "team_b" });
    fake.seed("sync_outbox", [build_entry(), second]);
    await mark_outbox_entry_rejected(fake.database, build_entry(), {
      code: "rejected_wrong_organization",
      message: "Record organization does not match caller organization",
    });
    await mark_outbox_entry_conflicted(fake.database, second, 9);
    const summary = await summarize_outbox(fake.database);
    expect(summary).toEqual({
      pending_count: 0,
      rejected_count: 1,
      conflicted_count: 1,
    });
    expect(count_unsynced_changes(summary)).toBe(2);
    expect(
      await list_pending_entries_for_table(fake.database, "teams"),
    ).toEqual([]);
  });

  it("lists only tables that have pending entries", async () => {
    const fake = create_fake_sync_database();
    fake.seed("sync_outbox", [
      build_entry(),
      build_entry({ table_name: "players", status: "rejected" }),
    ]);
    expect(await list_tables_with_pending_entries(fake.database)).toEqual(
      new Set(["teams"]),
    );
  });

  it("starts the cursor at zero for never-pulled tables", async () => {
    const fake = create_fake_sync_database();
    expect(await read_sync_cursor(fake.database, "teams")).toBe(0);
  });
});

describe("enqueue_local_snapshot", () => {
  it("enqueues every local record that has no outbox entry yet", async () => {
    const fake = create_fake_sync_database();
    fake.seed("teams", [{ id: "team_a" }, { id: "team_b" }]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);
    const enqueued = await enqueue_local_snapshot({
      database: fake.database,
      table_names: ["teams"],
      generate_change_token: () => "snapshot_token",
      now_iso: () => "2024-02-01T00:00:00.000Z",
    });
    expect(enqueued).toBe(1);
    expect(
      fake.rows("sync_outbox").map((row) => [row.local_id, row.operation]),
    ).toEqual([
      ["team_a", "delete"],
      ["team_b", "upsert"],
    ]);
  });
});
