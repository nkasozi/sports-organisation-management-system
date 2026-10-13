import { describe, expect, it } from "vitest";

import { push_table_outbox_to_convex } from "./syncPushService";
import {
  build_entry,
  create_command,
  upsert_response,
} from "./syncPushService.test_support";

const LARGE_INLINE_LOGO = `data:image/png;base64,${"A".repeat(1_000_000)}`;

describe("push_table_outbox_to_convex with oversized inline images", () => {
  it("keeps the user's inline image in the local record and parks the change for review", async () => {
    const { fake, mutation, command } = create_command([]);
    const local_team = {
      id: "team_a",
      name: "Lions",
      logo_url: LARGE_INLINE_LOGO,
    };
    fake.seed("teams", [local_team]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(fake.rows("teams")).toEqual([local_team]);
    expect(mutation).not.toHaveBeenCalled();
    expect(result.success && result.data.rejected[0]).toMatchObject({
      local_id: "team_a",
      rejection_code: "record_too_large",
    });
    expect(fake.rows("sync_outbox")).toEqual([
      expect.objectContaining({ local_id: "team_a", status: "rejected" }),
    ]);
  });

  it("does not touch the local record when the push request fails", async () => {
    const { fake, mutation, command } = create_command([]);
    mutation.mockRejectedValueOnce(new Error("offline"));
    const local_team = {
      id: "team_a",
      name: "Lions",
      logo_url: "data:image/png;base64,AAAA",
    };
    fake.seed("teams", [local_team]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success).toBe(false);
    expect(fake.rows("teams")).toEqual([local_team]);
    expect(fake.rows("sync_outbox")[0]).toMatchObject({ status: "pending" });
  });

  it("sends small inline images unchanged", async () => {
    const { fake, mutation, command } = create_command([
      upsert_response("updated"),
    ]);
    const local_team = { id: "team_a", logo_url: "data:image/png;base64,AAAA" };
    fake.seed("teams", [local_team]);
    fake.seed("sync_outbox", [build_entry()]);

    const result = await push_table_outbox_to_convex(command);

    expect(result.success).toBe(true);
    expect(mutation.mock.calls[0][1].records[0].data).toEqual(local_team);
  });
});
