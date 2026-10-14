import { afterEach, describe, expect, it, vi } from "vitest";

import { sync_deferred_remote_changes } from "./syncDeferredRemoteChanges";
import { push_table_outbox_to_convex } from "./syncPushService";
import {
  build_entry,
  create_command,
  upsert_response,
} from "./syncPushService.test_support";
import { apply_remote_change_page } from "./syncRemoteApply";

const NORMALIZED_SERVER_RECORD = {
  local_id: "team_a",
  name: "Lions",
  organization_id: "org_from_server",
  version: 5,
  sync_sequence: 30,
};

afterEach(() => {
  sync_deferred_remote_changes.clear();
});

async function defer_remote_copy_during_push(
  harness: ReturnType<typeof create_command>,
): Promise<void> {
  await apply_remote_change_page(harness.command, {
    table_name: "teams",
    records: [
      {
        local_id: "team_a",
        server_version: 5,
        server_sequence: 30,
        local_data: { id: "team_a", name: "Lions" },
      },
    ],
    deletions: [],
    next_cursor: 30,
  });
}

describe("push settlement after a realtime pull skipped the record", () => {
  it("applies the server's normalized copy once the push is confirmed", async () => {
    const harness = create_command([]);
    harness.fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    harness.fake.seed("sync_outbox", [build_entry()]);
    harness.mutation.mockImplementationOnce(async () => {
      await defer_remote_copy_during_push(harness);
      return upsert_response("updated");
    });
    vi.mocked(harness.command.convex_client.query).mockResolvedValue({
      status: "found",
      record: NORMALIZED_SERVER_RECORD,
    });

    expect((await push_table_outbox_to_convex(harness.command)).success).toBe(
      true,
    );

    expect(harness.fake.rows("teams")).toEqual([
      { id: "team_a", name: "Lions", organization_id: "org_from_server" },
    ]);
    expect(harness.fake.rows("sync_record_versions")).toEqual([
      expect.objectContaining({ server_version: 5, server_sequence: 30 }),
    ]);
  });

  it("does not fetch records that no pull skipped", async () => {
    const harness = create_command([upsert_response("updated")]);
    harness.fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    harness.fake.seed("sync_outbox", [build_entry()]);

    expect((await push_table_outbox_to_convex(harness.command)).success).toBe(
      true,
    );

    expect(harness.command.convex_client.query).not.toHaveBeenCalled();
  });

  it("rewinds the table cursor when the server copy cannot be loaded", async () => {
    const harness = create_command([]);
    harness.fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    harness.fake.seed("sync_outbox", [build_entry()]);
    harness.mutation.mockImplementationOnce(async () => {
      await defer_remote_copy_during_push(harness);
      return upsert_response("updated");
    });
    vi.mocked(harness.command.convex_client.query).mockRejectedValue(
      new Error("offline"),
    );

    expect((await push_table_outbox_to_convex(harness.command)).success).toBe(
      true,
    );

    expect(harness.fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 0 },
    ]);
  });
});
