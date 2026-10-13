import type { DBCoreMutateRequest } from "dexie";
import { describe, expect, it } from "vitest";

import { UntrackedWriteReason } from "./syncChangeTrackingGate";
import {
  create_outbox_stack,
  put_team,
  read_outbox_entries,
} from "./syncOutboxMiddleware.test_support";

const READ_WRITE_MODE = "readwrite";

describe("sync outbox middleware tracking boundaries", () => {
  it("records user writes even though no sync engine was ever started", async () => {
    const stack = create_outbox_stack();
    const user_transaction = stack.stack.transaction(
      ["teams"],
      READ_WRITE_MODE,
    );
    await put_team(stack, user_transaction, [{ id: "team_offline" }]);
    expect(read_outbox_entries(stack).map((entry) => entry.local_id)).toEqual([
      "team_offline",
    ]);
  });

  it("does not record writes made inside a remote-apply transaction", async () => {
    const stack = create_outbox_stack();
    const remote_transaction = { id: "remote" };
    stack.gate.mark_remote_apply_transaction(remote_transaction);
    await stack.stack.table("teams").mutate({
      type: "delete",
      trans: remote_transaction,
      keys: ["team_1"],
    } as unknown as DBCoreMutateRequest);
    expect(read_outbox_entries(stack)).toEqual([]);
  });

  it("does not record writes made inside a transaction marked as a backup restore", async () => {
    const stack = create_outbox_stack();
    const restore_transaction = { id: "restore" };
    stack.gate.mark_untracked_transaction(
      restore_transaction,
      UntrackedWriteReason.BACKUP_RESTORE,
    );
    await put_team(stack, restore_transaction, [{ id: "team_restored" }]);
    expect(read_outbox_entries(stack)).toEqual([]);
  });

  it("never turns a table clear into per-record deletes", async () => {
    const stack = create_outbox_stack();
    stack.table_rows("teams").set(JSON.stringify("team_1"), { id: "team_1" });
    await stack.stack.table("teams").mutate({
      type: "deleteRange",
      trans: { id: "clear" },
      range: { type: 3, lower: undefined, upper: undefined },
    } as unknown as DBCoreMutateRequest);
    expect(stack.table_rows("teams").size).toBe(0);
    expect(read_outbox_entries(stack)).toEqual([]);
  });
});
