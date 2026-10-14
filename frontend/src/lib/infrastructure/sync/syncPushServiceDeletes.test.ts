import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import { build_entry, create_command } from "./syncPushService.test_support";

describe("push_table_outbox_to_convex deletes", () => {
  it("sends deletes through the outbox and confirms them", async () => {
    const { fake, mutation, command } = create_command([
      {
        success: true,
        results: [
          {
            local_id: "team_a",
            success: true,
            action: "deleted",
            server_version: 5,
          },
        ],
        conflicts: [],
      },
    ]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);
    expect((await push_table_outbox_to_convex(command)).success).toBe(true);
    expect(mutation).toHaveBeenCalledWith("sync:batch_delete", {
      table_name: "teams",
      records: [
        { local_id: "team_a", base_version: { kind: "known", version: 4 } },
      ],
    });
    expect(fake.rows("sync_outbox")).toEqual([]);
  });

  it("drops entries whose local record no longer exists", async () => {
    const { fake, mutation, command } = create_command([]);
    fake.seed("sync_outbox", [build_entry()]);
    expect((await push_table_outbox_to_convex(command)).success).toBe(true);
    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(mutation).not.toHaveBeenCalled();
  });

  it("parks a conflicting delete for review even when the server omits its copy", async () => {
    const { fake, command } = create_command([
      {
        success: true,
        results: [
          {
            local_id: "team_a",
            success: true,
            action: "conflict_detected",
            server_version: 9,
          },
        ],
        conflicts: [],
      },
    ]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")[0].status).toBe("rejected");
  });

  it("keeps a newer local edit made while the delete was in flight", async () => {
    const { fake, mutation, command } = create_command([]);
    mutation.mockImplementationOnce(async () => {
      fake.seed("teams", [{ id: "team_a", name: "Recreated locally" }]);
      fake.seed("sync_outbox", [
        build_entry({ operation: "upsert", change_token: "token_newer" }),
      ]);
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
            remote_data: { local_id: "team_a", name: "Theirs", version: 9 },
            remote_version: 9,
          },
        ],
      };
    });
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.rejected).toEqual([]);
    expect(fake.rows("teams")).toEqual([
      { id: "team_a", name: "Recreated locally" },
    ]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({
      change_token: "token_newer",
      status: "pending",
    });
  });
});
