import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import { build_entry, create_command } from "./syncPushService.test_support";

const DELETED_AT = "2024-03-01T00:00:00.000Z";

function deleted_remotely_response(): Record<string, unknown> {
  return {
    success: true,
    results: [
      {
        local_id: "team_a",
        success: true,
        action: "deleted_remotely",
        server_version: 6,
      },
    ],
    has_conflicts: false,
    conflicts: [],
    deleted_remotely: [
      {
        local_id: "team_a",
        local_version: 4,
        tombstone_version: 6,
        deleted_at: DELETED_AT,
      },
    ],
  };
}

function conflict_response(
  remote_updated_by: unknown,
): Record<string, unknown> {
  return {
    success: true,
    results: [
      {
        local_id: "team_a",
        success: true,
        action: "conflict_detected",
        server_version: 7,
      },
    ],
    has_conflicts: true,
    conflicts: [
      {
        local_id: "team_a",
        local_data: { name: "Mine" },
        local_version: 4,
        remote_data: { name: "Theirs" },
        remote_version: 7,
        remote_updated_at: "2024-02-01T00:00:00.000Z",
        remote_updated_by,
      },
    ],
    deleted_remotely: [],
  };
}

describe("push outbox against the versioned server contract", () => {
  it("parks a change to a record deleted on another device and reports it", async () => {
    const { fake, command } = create_command([deleted_remotely_response()]);
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.records_pushed).toBe(0);
    expect(result.success && result.data.deleted_remotely).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        local_data: { id: "team_a", name: "Mine" },
        tombstone_version: 6,
        deleted_at: DELETED_AT,
      },
    ]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "conflicted",
      remote_version: 6,
    });
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
  });

  it("sends an explicit re-create base when the user restores a deleted record", async () => {
    const { fake, mutation, command } = create_command([
      {
        success: true,
        results: [
          {
            local_id: "team_a",
            success: true,
            action: "created",
            server_version: 7,
          },
        ],
        conflicts: [],
        deleted_remotely: [],
      },
    ]);
    fake.seed("teams", [{ id: "team_a" }]);
    fake.seed("sync_outbox", [
      build_entry({ base_version: { kind: "recreate" } }),
    ]);

    const push_result = await push_table_outbox_to_convex(command);

    expect(push_result.success).toBe(true);
    expect(mutation.mock.calls[0][1].records[0]).toMatchObject({
      version: 0,
      base_version: { kind: "recreate" },
    });
    expect(fake.rows("sync_outbox")).toEqual([]);
  });

  it("reads the remote author from the tagged server shape", async () => {
    const known = create_command([
      conflict_response({ kind: "known", updated_by: "user_7" }),
    ]);
    known.fake.seed("teams", [{ id: "team_a" }]);
    known.fake.seed("sync_outbox", [build_entry()]);
    const unknown = create_command([conflict_response({ kind: "unknown" })]);
    unknown.fake.seed("teams", [{ id: "team_a" }]);
    unknown.fake.seed("sync_outbox", [build_entry()]);

    const known_result = await push_table_outbox_to_convex(known.command);
    const unknown_result = await push_table_outbox_to_convex(unknown.command);

    expect(
      known_result.success && known_result.data.conflicts[0].remote_updated_by,
    ).toEqual({ status: "known", value: "user_7" });
    expect(
      unknown_result.success &&
        unknown_result.data.conflicts[0].remote_updated_by,
    ).toEqual({ status: "unknown" });
  });

  it("rejects an oversized record without blocking the rest of the table", async () => {
    const { fake, mutation, command } = create_command([
      {
        success: true,
        results: [
          {
            local_id: "team_b",
            success: true,
            action: "updated",
            server_version: 2,
          },
        ],
        conflicts: [],
        deleted_remotely: [],
      },
    ]);
    fake.seed("teams", [
      { id: "team_a", notes: "x".repeat(1_000_000) },
      { id: "team_b", name: "Small" },
    ]);
    fake.seed("sync_outbox", [
      build_entry(),
      build_entry({ local_id: "team_b", change_token: "token_b" }),
    ]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.records_pushed).toBe(1);
    expect(result.success && result.data.rejected[0]).toMatchObject({
      local_id: "team_a",
      rejection_code: "record_too_large",
    });
    expect(
      mutation.mock.calls[0][1].records.map(
        (r: { local_id: string }) => r.local_id,
      ),
    ).toEqual(["team_b"]);
    expect(fake.rows("sync_outbox")).toEqual([
      expect.objectContaining({ local_id: "team_a", status: "rejected" }),
    ]);
  });
});
