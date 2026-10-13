import { describe, expect, it } from "vitest";

import {
  type ChangeTrackingGate,
  create_change_tracking_gate,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  create_fake_sync_database,
  type FakeSyncDatabase,
} from "./syncFakeDatabase.test_support";
import {
  apply_remote_change_page,
  convert_server_record_to_remote_change,
} from "./syncRemoteApply";
import {
  apply_resolved_remote_record,
  ResolvedApplyOutcome,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";

interface RemoteApplyHarness {
  fake: FakeSyncDatabase;
  gate: ChangeTrackingGate;
  dependencies: {
    database: FakeSyncDatabase["database"];
    gate: ChangeTrackingGate;
  };
}

function create_dependencies(): RemoteApplyHarness {
  const fake = create_fake_sync_database();
  const gate = create_change_tracking_gate();
  return { fake, gate, dependencies: { database: fake.database, gate } };
}

const PENDING_ENTRY = {
  table_name: "teams",
  local_id: "team_dirty",
  operation: "upsert",
  base_version: { kind: "known", version: 1 },
  change_token: "token",
  enqueued_at: "2024-01-01T00:00:00.000Z",
  status: "pending",
};

describe("convert_server_record_to_remote_change", () => {
  it("strips server bookkeeping and keys the record by its local id", () => {
    expect(
      convert_server_record_to_remote_change({
        _id: "convex_id",
        _creationTime: 1,
        local_id: "team_a",
        synced_at: "2024-01-01T00:00:00.000Z",
        version: 4,
        sync_sequence: 9,
        name: "Lions",
      }),
    ).toEqual({
      local_id: "team_a",
      server_version: 4,
      local_data: { id: "team_a", name: "Lions" },
    });
  });
});

describe("apply_remote_change_page", () => {
  it("applies records and tombstones, records versions and advances the cursor", async () => {
    const { fake, dependencies } = create_dependencies();
    fake.seed("teams", [{ id: "team_gone", name: "Old" }]);
    const summary = await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [
        {
          local_id: "team_a",
          server_version: 2,
          local_data: { id: "team_a", name: "Lions" },
        },
      ],
      deletions: [{ local_id: "team_gone", server_version: 3 }],
      next_cursor: 12,
    });
    expect(summary).toEqual({ applied_count: 2, deferred_local_ids: [] });
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Lions" }]);
    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        server_version: 2,
        record_state: "live",
      },
      {
        table_name: "teams",
        local_id: "team_gone",
        server_version: 3,
        record_state: "deleted",
      },
    ]);
    expect(fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 12 },
    ]);
  });

  it("never overwrites or deletes a record with unsynced local changes", async () => {
    const { fake, dependencies } = create_dependencies();
    fake.seed("teams", [{ id: "team_dirty", name: "Mine" }]);
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const summary = await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [
        {
          local_id: "team_dirty",
          server_version: 5,
          local_data: { id: "team_dirty", name: "Theirs" },
        },
      ],
      deletions: [],
      next_cursor: 3,
    });
    expect(summary.deferred_local_ids).toEqual(["team_dirty"]);
    expect(fake.rows("teams")).toEqual([{ id: "team_dirty", name: "Mine" }]);
    expect(fake.rows("sync_record_versions")).toEqual([]);
  });

  it("never moves the cursor backwards", async () => {
    const { fake, dependencies } = create_dependencies();
    fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 40 }]);
    await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [],
      deletions: [],
      next_cursor: 10,
    });
    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(40);
  });

  it("marks its transaction as a remote apply so it is never enqueued", async () => {
    const { fake, gate, dependencies } = create_dependencies();
    await apply_remote_change_page(dependencies, {
      table_name: "teams",
      records: [],
      deletions: [],
      next_cursor: 1,
    });
    expect(gate.should_track_write(fake.transaction_markers[0])).toBe(false);
  });
});

describe("apply_resolved_remote_record", () => {
  it("stores the resolved copy, its server version and clears the outbox entry", async () => {
    const { fake, dependencies } = create_dependencies();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const outcome = await apply_resolved_remote_record(
      dependencies,
      "teams",
      {
        local_id: "team_dirty",
        server_version: 8,
        local_data: { id: "team_dirty", name: "Resolved" },
      },
      {
        kind: ResolvedRecordGuardKind.CHANGE_TOKEN,
        change_token: PENDING_ENTRY.change_token,
      },
    );
    expect(outcome).toBe(ResolvedApplyOutcome.APPLIED);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("teams")).toEqual([
      { id: "team_dirty", name: "Resolved" },
    ]);
    expect(fake.rows("sync_record_versions")[0].server_version).toBe(8);
  });

  it("keeps a newer local edit instead of overwriting it with the resolved copy", async () => {
    const { fake, dependencies } = create_dependencies();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    fake.seed("teams", [{ id: "team_dirty", name: "Edited again" }]);

    const outcome = await apply_resolved_remote_record(
      dependencies,
      "teams",
      {
        local_id: "team_dirty",
        server_version: 8,
        local_data: { id: "team_dirty", name: "Resolved" },
      },
      { kind: ResolvedRecordGuardKind.CONFLICTED_ENTRY },
    );

    expect(outcome).toBe(ResolvedApplyOutcome.KEPT_NEWER_LOCAL_EDIT);
    expect(fake.rows("teams")).toEqual([
      { id: "team_dirty", name: "Edited again" },
    ]);
    expect(fake.rows("sync_outbox")[0].base_version).toEqual({
      kind: "known",
      version: 8,
    });
  });
});
