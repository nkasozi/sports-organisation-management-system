import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import {
  build_entry,
  create_command,
  upsert_response,
} from "./syncPushService.test_support";

function read_pushed_records(
  mutation: ReturnType<typeof create_command>["mutation"],
): Array<Record<string, unknown>> {
  return mutation.mock.calls[0][1].records;
}

describe("push_table_outbox_to_convex cleared optional fields", () => {
  it("lists fields the user cleared so the server can unset them", async () => {
    const { fake, mutation, command } = create_command([
      upsert_response("updated"),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Lions", nickname: undefined }]);
    fake.seed("sync_outbox", [build_entry()]);

    expect((await push_table_outbox_to_convex(command)).success).toBe(true);

    const [pushed] = read_pushed_records(mutation);
    expect(pushed.cleared_fields).toEqual(["nickname"]);
    expect(Object.keys(pushed.data as object)).toEqual(["id", "name"]);
  });

  it("omits the cleared list when nothing was cleared so older servers accept the batch", async () => {
    const { fake, mutation, command } = create_command([
      upsert_response("updated"),
    ]);
    fake.seed("teams", [{ id: "team_a", name: "Lions" }]);
    fake.seed("sync_outbox", [build_entry()]);

    expect((await push_table_outbox_to_convex(command)).success).toBe(true);

    const [pushed] = read_pushed_records(mutation);
    expect(Object.keys(pushed)).not.toContain("cleared_fields");
  });
});
