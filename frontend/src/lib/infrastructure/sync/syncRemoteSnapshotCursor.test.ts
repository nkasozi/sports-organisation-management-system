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
  apply_remote_snapshot_records,
  SnapshotCursorPolicy,
} from "./syncRemoteApplyRecords";

function create_dependencies(): {
  fake: FakeSyncDatabase;
  dependencies: {
    database: FakeSyncDatabase["database"];
    gate: ChangeTrackingGate;
  };
} {
  const fake = create_fake_sync_database();
  return {
    fake,
    dependencies: {
      database: fake.database,
      gate: create_change_tracking_gate(),
    },
  };
}

const SEQUENCED_RECORDS = [
  { local_id: "team_a", version: 1, sync_sequence: 4 },
  { local_id: "team_b", version: 2, sync_sequence: 9 },
];

describe("remote snapshot cursor", () => {
  it("advances the cursor to the snapshot's newest sequence for a full caller snapshot", async () => {
    const { fake, dependencies } = create_dependencies();

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      SEQUENCED_RECORDS,
      SnapshotCursorPolicy.ADVANCE_TO_SNAPSHOT,
    );

    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(9);
  });

  it("keeps the cursor at the start when any record is not sequenced yet", async () => {
    const { fake, dependencies } = create_dependencies();

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      [...SEQUENCED_RECORDS, { local_id: "team_c", version: 1 }],
      SnapshotCursorPolicy.ADVANCE_TO_SNAPSHOT,
    );

    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(0);
  });

  it("never advances the cursor for partial snapshots", async () => {
    const { fake, dependencies } = create_dependencies();

    await apply_remote_snapshot_records(
      dependencies,
      "teams",
      SEQUENCED_RECORDS,
      SnapshotCursorPolicy.KEEP_CURSOR,
    );

    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(0);
  });
});
