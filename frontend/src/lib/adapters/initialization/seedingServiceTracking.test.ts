import "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";

import { beforeAll, describe, expect, it, vi } from "vitest";

import { get_database } from "$lib/adapters/repositories/database";
import { get_venue_repository } from "$lib/adapters/repositories/InBrowserVenueRepository";

import { SEEDING_COMPLETION_STATE } from "./initializationConstants";
import { seed_all_data_if_needed } from "./seedingService";

vi.mock("./seedingTypes", () => ({
  is_seeding_already_complete: vi.fn(async () => "not_complete"),
  mark_seeding_complete: vi.fn(async () => ({ success: true, data: true })),
}));

vi.mock("$lib/presentation/stores/currentUser", () => ({
  current_user_store: { set_user: vi.fn(async () => true) },
}));

beforeAll(() => {
  (globalThis as Record<string, unknown>).window = globalThis;
});

async function read_queued_ids(): Promise<string[]> {
  const queued = await get_database().table("sync_outbox").toArray();
  return queued.map((entry) => `${entry.table_name}:${entry.local_id}`);
}

describe("seed_all_data_if_needed change tracking on a real Dexie database", () => {
  it("never queues the demo seed but queues a user write made while seeding runs", async () => {
    expect(SEEDING_COMPLETION_STATE.NOT_COMPLETE).toBe("not_complete");
    const seeding = seed_all_data_if_needed();
    const user_write = await get_venue_repository().create({
      name: "Venue typed during seeding",
    } as never);
    const result = await seeding;
    await get_database().table("players").put({ id: "player_after_seed" });

    expect(result).toEqual({ success: true, data: true });
    expect(await get_database().table("teams").count()).toBeGreaterThan(0);
    expect(user_write.success).toBe(true);
    const user_venue_id = user_write.success ? user_write.data.id : "";
    expect((await read_queued_ids()).sort()).toEqual(
      [`venues:${user_venue_id}`, "players:player_after_seed"].sort(),
    );
  });
});
