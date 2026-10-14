import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import { build_entry, create_command } from "./syncPushService.test_support";

const HIDDEN_SERVER_COPY_TEXT = "isn't visible to your account";

function upsert_conflict_response(
  remote_data_status: string,
): Record<string, unknown> {
  const is_hidden = remote_data_status === "hidden";
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
    conflicts: [
      {
        local_id: "team_a",
        local_data: { name: "Mine" },
        local_version: 4,
        remote_data: is_hidden ? {} : { name: "Theirs" },
        remote_data_status,
        remote_version: 7,
        remote_updated_at: is_hidden ? "" : "2024-02-01T00:00:00.000Z",
        remote_updated_by: { kind: "unknown" },
      },
    ],
    deleted_remotely: [],
  };
}

function delete_conflict_response(
  remote_data_status: string,
): Record<string, unknown> {
  return {
    success: true,
    results: [
      {
        local_id: "team_a",
        success: true,
        action: "conflict_detected",
        server_version: 9,
      },
    ],
    conflicts: [
      {
        local_id: "team_a",
        remote_data: {},
        remote_data_status,
        remote_version: 9,
      },
    ],
  };
}

describe("push conflicts whose server copy is hidden from the caller", () => {
  it("sends a hidden upsert conflict to review instead of the field merge", async () => {
    const { fake, command } = create_command([
      upsert_conflict_response("hidden"),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.conflicts).toEqual([]);
    expect(result.success && result.data.rejected).toEqual([
      expect.objectContaining({
        local_id: "team_a",
        rejection_code: "conflict_remote_hidden",
        rejection_message: expect.stringContaining(HIDDEN_SERVER_COPY_TEXT),
      }),
    ]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "rejected",
      rejection_code: "conflict_remote_hidden",
      base_version: { kind: "known", version: 7 },
    });
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Mine" }]);
  });

  it("keeps visible upsert conflicts on the merge screen", async () => {
    const { fake, command } = create_command([
      upsert_conflict_response("visible"),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Mine" }]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.conflicts).toEqual([
      expect.objectContaining({
        local_id: "team_a",
        remote_data: { name: "Theirs" },
        remote_data_status: "visible",
      }),
    ]);
    expect(result.success && result.data.rejected).toEqual([]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({ status: "conflicted" });
  });

  it("explains a hidden server copy when a delete loses to a remote update", async () => {
    const { fake, command } = create_command([
      delete_conflict_response("hidden"),
    ]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.rejected).toEqual([
      expect.objectContaining({
        rejection_code: "delete_remote_hidden",
        rejection_message: expect.stringContaining(HIDDEN_SERVER_COPY_TEXT),
      }),
    ]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "rejected",
      base_version: { kind: "known", version: 9 },
    });
  });

  it("keeps the regular review message for a visible delete conflict", async () => {
    const { fake, command } = create_command([
      delete_conflict_response("visible"),
    ]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.rejected).toEqual([
      expect.objectContaining({ rejection_code: "delete_needs_review" }),
    ]);
  });
});
