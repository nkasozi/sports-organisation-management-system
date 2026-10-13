import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import {
  build_entry,
  create_command,
  upsert_response,
} from "./syncPushService.test_support";

describe("push_table_outbox_to_convex upserts", () => {
  it("does nothing when the table has no pending outbox entries", async () => {
    const { mutation, command } = create_command([]);
    const result = await push_table_outbox_to_convex(command);
    expect(result).toEqual({
      success: true,
      data: {
        records_pushed: 0,
        conflicts: [],
        rejected: [],
        deleted_remotely: [],
      },
    });
    expect(mutation).not.toHaveBeenCalled();
  });

  it("pushes the current record with its base version and confirms only on success", async () => {
    const { fake, mutation, command } = create_command([
      upsert_response("updated"),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    fake.seed("sync_outbox", [build_entry()]);
    const result = await push_table_outbox_to_convex(command);
    expect(mutation).toHaveBeenCalledWith("sync:batch_upsert", {
      table_name: "teams",
      records: [
        {
          local_id: "team_a",
          data: { id: "team_a", name: "Lions" },
          version: 4,
          base_version: { kind: "known", version: 4 },
        },
      ],
      detect_conflicts: true,
    });
    expect(result.success && result.data.records_pushed).toBe(1);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "teams",
        local_id: "team_a",
        server_version: 5,
        record_state: "live",
      },
    ]);
  });

  it("keeps rejected changes in a rejected state and never counts them as pushed", async () => {
    const { fake, command } = create_command([
      upsert_response("rejected_wrong_organization", false, 0),
    ]);
    fake.seed("teams", [{ id: "team_a" }]);
    fake.seed("sync_outbox", [build_entry()]);
    const result = await push_table_outbox_to_convex(command);
    expect(result).toEqual({
      success: true,
      data: {
        records_pushed: 0,
        conflicts: [],
        deleted_remotely: [],
        rejected: [
          {
            table_name: "teams",
            local_id: "team_a",
            rejection_code: "rejected_wrong_organization",
            rejection_message:
              "Record organization does not match caller organization",
          },
        ],
      },
    });
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "rejected",
      rejection_code: "rejected_wrong_organization",
    });
  });

  it("parks conflicting changes and surfaces the server copy", async () => {
    const { fake, command } = create_command([
      upsert_response("conflict_detected", true, 7),
    ]);
    fake.seed("teams", [{ id: "team_a" }]);
    fake.seed("sync_outbox", [build_entry()]);
    const result = await push_table_outbox_to_convex(command);
    expect(result.success && result.data.conflicts[0].remote_version).toBe(7);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      status: "conflicted",
      remote_version: 7,
    });
  });

  it("leaves entries pending when the server rejects the whole batch", async () => {
    const { fake, command } = create_command([
      { success: false, error: "authentication_required", message: "x" },
    ]);
    fake.seed("teams", [{ id: "team_a" }]);
    fake.seed("sync_outbox", [build_entry()]);
    const result = await push_table_outbox_to_convex(command);
    expect(result).toEqual({
      success: false,
      error: "authentication_required: x",
    });
    expect(fake.rows("sync_outbox")[0].status).toBe("pending");
  });
});
