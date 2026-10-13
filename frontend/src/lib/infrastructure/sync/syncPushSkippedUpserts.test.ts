import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import {
  build_entry,
  create_command,
  upsert_response,
} from "./syncPushService.test_support";

async function push_skipped_result(
  entry_overrides: Record<string, unknown>,
  server_version: number,
): Promise<ReturnType<typeof create_command>["fake"]> {
  const { fake, command } = create_command([
    upsert_response("skipped", true, server_version),
  ]);
  fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
  fake.seed("sync_outbox", [build_entry(entry_overrides)]);
  fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 40 }]);
  const result = await push_table_outbox_to_convex(command);
  expect(result.success).toBe(true);
  return fake;
}

describe("push_table_outbox_to_convex skipped upserts", () => {
  it("re-pulls the table when the server skipped the change but holds a newer version", async () => {
    const fake = await push_skipped_result({}, 6);

    expect(fake.rows("sync_outbox")).toEqual([]);
    expect(fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 0 },
    ]);
  });

  it("re-pulls the table when a skipped change had no known base version", async () => {
    const fake = await push_skipped_result(
      { base_version: { kind: "unknown" } },
      2,
    );

    expect(fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 0 },
    ]);
  });

  it("keeps the cursor when the skipped change was already based on the server version", async () => {
    const fake = await push_skipped_result({}, 4);

    expect(fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 40 },
    ]);
  });

  it("keeps the cursor for an ordinary update", async () => {
    const { fake, command } = create_command([
      upsert_response("updated", true, 5),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    fake.seed("sync_outbox", [build_entry()]);
    fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 40 }]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success).toBe(true);
    expect(fake.rows("sync_cursors")).toEqual([
      { table_name: "teams", after_sequence: 40 },
    ]);
  });
});
