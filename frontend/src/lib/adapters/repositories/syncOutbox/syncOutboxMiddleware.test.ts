import type { DBCoreMutateRequest } from "dexie";
import { describe, expect, it } from "vitest";

import { include_sync_bookkeeping_stores } from "./syncOutboxMiddleware";
import {
  create_outbox_stack,
  put_team,
  read_outbox_entries,
} from "./syncOutboxMiddleware.test_support";
import {
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
} from "./syncOutboxTypes";

const transaction = { id: "trans" };

describe("sync outbox middleware entries", () => {
  it("falls back to update keys or primary keys when a put carries an empty key list", async () => {
    const stack = create_outbox_stack();
    await stack.stack.table("teams").mutate({
      type: "put",
      trans: transaction,
      keys: [],
      values: [{ id: "team_from_values" }],
    } as unknown as DBCoreMutateRequest);
    await stack.stack.table("teams").mutate({
      type: "put",
      trans: transaction,
      keys: [],
      values: [{ id: "team_from_updates" }],
      updates: { keys: ["team_from_updates"], changeSpecs: [{}] },
    } as unknown as DBCoreMutateRequest);
    expect(
      read_outbox_entries(stack)
        .map((entry) => entry.local_id)
        .sort(),
    ).toEqual(["team_from_updates", "team_from_values"]);
  });

  it("records a pending upsert with an unknown base for a never-synced record", async () => {
    const stack = create_outbox_stack();
    await put_team(stack, transaction, [{ id: "team_1", name: "Lions" }]);
    expect(read_outbox_entries(stack)).toEqual([
      {
        table_name: "teams",
        local_id: "team_1",
        operation: "upsert",
        base_version: { kind: "unknown" },
        change_token: "token_1",
        enqueued_at: "2024-05-01T00:00:00.000Z",
        status: "pending",
      },
    ]);
    expect(stack.on_local_changes_recorded).toHaveBeenCalledWith("teams", 1);
  });

  it("captures the last server version the edit was based on", async () => {
    const stack = create_outbox_stack();
    stack
      .table_rows(SYNC_RECORD_VERSIONS_TABLE_NAME)
      .set(JSON.stringify(["teams", "team_1"]), {
        table_name: "teams",
        local_id: "team_1",
        server_version: 7,
      });
    await put_team(stack, transaction, [{ id: "team_1" }]);
    expect(read_outbox_entries(stack)[0].base_version).toEqual({
      kind: "known",
      version: 7,
    });
  });

  it("coalesces a later delete into the existing entry keeping its base version", async () => {
    const stack = create_outbox_stack();
    const versions = stack.table_rows(SYNC_RECORD_VERSIONS_TABLE_NAME);
    versions.set(JSON.stringify(["teams", "team_1"]), { server_version: 3 });
    await put_team(stack, transaction, [{ id: "team_1" }]);
    versions.set(JSON.stringify(["teams", "team_1"]), { server_version: 9 });
    await stack.stack.table("teams").mutate({
      type: "delete",
      trans: transaction,
      keys: ["team_1"],
    } as unknown as DBCoreMutateRequest);
    expect(read_outbox_entries(stack)).toHaveLength(1);
    expect(read_outbox_entries(stack)[0]).toMatchObject({
      operation: "delete",
      base_version: { kind: "known", version: 3 },
      change_token: "token_2",
    });
  });

  it("ignores tables that are not synced and keys that failed to write", async () => {
    const stack = create_outbox_stack(new Set(["team_bad"]));
    await stack.stack.table("app_settings").mutate({
      type: "put",
      trans: transaction,
      values: [{ id: "theme" }],
    } as unknown as DBCoreMutateRequest);
    await put_team(stack, transaction, [{ id: "team_bad" }, { id: "team_ok" }]);
    expect(read_outbox_entries(stack).map((entry) => entry.local_id)).toEqual([
      "team_ok",
    ]);
  });
});

describe("include_sync_bookkeeping_stores", () => {
  it("adds bookkeeping stores only to read-write transactions on synced tables", () => {
    const tracked = new Set(["teams"]);
    expect(
      include_sync_bookkeeping_stores(["teams"], "readwrite", tracked),
    ).toEqual([
      "teams",
      SYNC_OUTBOX_TABLE_NAME,
      SYNC_RECORD_VERSIONS_TABLE_NAME,
    ]);
    expect(
      include_sync_bookkeeping_stores(["teams"], "readonly", tracked),
    ).toEqual(["teams"]);
    expect(
      include_sync_bookkeeping_stores(["app_settings"], "readwrite", tracked),
    ).toEqual(["app_settings"]);
  });
});
