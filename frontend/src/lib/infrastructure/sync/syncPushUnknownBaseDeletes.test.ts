import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import { build_entry, create_command } from "./syncPushService.test_support";

function conflicted_delete_response(): Record<string, unknown> {
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
}

describe("push_table_outbox_to_convex deletes without a known base version", () => {
  it("parks the delete for review instead of silently restoring the record", async () => {
    const { fake, command } = create_command([conflicted_delete_response()]);
    fake.seed("sync_outbox", [
      build_entry({ operation: "delete", base_version: { kind: "unknown" } }),
    ]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success && result.data.rejected).toEqual([
      expect.objectContaining({
        local_id: "team_a",
        rejection_code: "delete_needs_review",
      }),
    ]);
    expect(fake.rows("teams")).toEqual([]);
    expect(fake.rows("sync_outbox")).toEqual([
      expect.objectContaining({
        local_id: "team_a",
        operation: "delete",
        status: "rejected",
        rejection_code: "delete_needs_review",
        base_version: { kind: "known", version: 9 },
      }),
    ]);
  });

  it("still lets a newer remote update win over a delete with a known base", async () => {
    const { fake, command } = create_command([conflicted_delete_response()]);
    fake.seed("sync_outbox", [build_entry({ operation: "delete" })]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success).toBe(true);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Theirs" }]);
  });
});
