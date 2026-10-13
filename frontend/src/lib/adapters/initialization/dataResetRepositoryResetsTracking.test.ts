import "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";

import { describe, expect, it } from "vitest";

import { get_database } from "$lib/adapters/repositories/database";
import { create_system_write_origin } from "$lib/adapters/repositories/InBrowserRepositoryWriteOrigin";
import { get_venue_repository } from "$lib/adapters/repositories/InBrowserVenueRepository";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { run_untracked_write_scope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScope";

import { reset_all_local_repositories } from "./dataResetRepositoryResets";

describe("reset_all_local_repositories change tracking on a real Dexie database", () => {
  it("leaves the reset itself out of the outbox but queues a user write made mid-reset", async () => {
    await get_database().table("teams").put({ id: "team_before_reset" });
    await get_database().table("sync_outbox").clear();
    const scope_result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DATA_RESET,
      async (scope) => {
        const resetting = reset_all_local_repositories(
          create_system_write_origin(scope),
          scope.scope_id,
        );
        const user_write = await get_venue_repository().create({
          name: "Venue typed during reset",
        } as never);
        return { reset: await resetting, user_write };
      },
    );

    expect(scope_result.success).toBe(true);
    if (!scope_result.success) return;
    expect(scope_result.data.reset).toBe(true);
    const user_write = scope_result.data.user_write;
    expect(user_write.success).toBe(true);
    const queued = await get_database().table("sync_outbox").toArray();
    expect(queued.map((entry) => entry.local_id)).toEqual([
      user_write.success ? user_write.data.id : "",
    ]);
    expect(await get_database().table("teams").get("team_before_reset")).toBe(
      undefined,
    );
  });
});
