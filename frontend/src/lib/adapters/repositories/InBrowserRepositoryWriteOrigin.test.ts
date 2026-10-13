import { afterEach, describe, expect, it } from "vitest";

import type { SportSyncDatabase } from "./database";
import {
  create_system_write_origin,
  REPOSITORY_WRITE_ORIGIN_MESSAGE,
} from "./InBrowserRepositoryWriteOrigin";
import {
  build_origin_test_team,
  create_origin_test_team_repository,
} from "./InBrowserRepositoryWriteOrigin.test_support";
import {
  open_real_test_database,
  read_real_outbox_ids,
} from "./syncOutbox/realDexieDatabase.test_support";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
  type UntrackedWriteScope,
} from "./syncOutbox/syncChangeTrackingGate";
import { run_untracked_write_scope } from "./syncOutbox/untrackedWriteScope";

const opened_databases: SportSyncDatabase[] = [];

async function open_database(): Promise<SportSyncDatabase> {
  const database = open_real_test_database();
  opened_databases.push(database);
  await database.table("teams").put(build_origin_test_team("team_existing"));
  await database.table("sync_outbox").clear();
  return database;
}

afterEach(async () => {
  for (const database of opened_databases.splice(0)) await database.delete();
});

describe("repository write origin on a real Dexie database", () => {
  it("tracks a user write made while a data-reset scope is clearing and reseeding", async () => {
    const database = await open_database();
    const user_repository = create_origin_test_team_repository(database);
    const scope_result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DATA_RESET,
      async (scope) => {
        const system_repository = user_repository.with_write_origin(
          create_system_write_origin(scope),
        );
        const cleared = system_repository.clear_all_data();
        const user_write = user_repository.create({ name: "Typed mid-reset" });
        const seeded = system_repository.seed_with_data([
          build_origin_test_team("team_seeded"),
        ]);
        const outcomes = [await cleared, await seeded];
        return { outcomes, user_write: await user_write };
      },
    );
    expect(scope_result.success).toBe(true);
    if (!scope_result.success) return;
    expect(scope_result.data.outcomes.every((item) => item.success)).toBe(true);
    const user_write = scope_result.data.user_write;
    expect(user_write.success).toBe(true);
    const user_team_id = user_write.success ? user_write.data.id : "";
    expect(await read_real_outbox_ids(database)).toEqual([
      `teams:${user_team_id}`,
    ]);
  });

  it("tracks user updates, deletes and raw table writes made during a demo-seed scope", async () => {
    const database = await open_database();
    const user_repository = create_origin_test_team_repository(database);
    const scope_result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DEMO_SEED,
      async (scope) => {
        const system_repository = user_repository.with_write_origin(
          create_system_write_origin(scope),
        );
        const seeded = system_repository.seed_with_data([
          build_origin_test_team("team_demo"),
        ]);
        const updated = await user_repository.update("team_existing", {
          name: "Renamed",
        });
        await database.table("players").put({ id: "player_raw_write" });
        const seed_outcome = await seeded;
        const deleted = await user_repository.delete_by_id("team_demo");
        return updated.success && seed_outcome.success && deleted.success;
      },
    );
    expect(scope_result).toEqual({ success: true, data: true });
    expect(await read_real_outbox_ids(database)).toEqual([
      "players:player_raw_write",
      "teams:team_demo",
      "teams:team_existing",
    ]);
  });

  it("keeps system-origin create, update and delete untracked inside the scope", async () => {
    const database = await open_database();
    const user_repository = create_origin_test_team_repository(database);
    const scope_result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DEMO_SEED,
      async (scope) => {
        const system_repository = user_repository.with_write_origin(
          create_system_write_origin(scope),
        );
        const created = await system_repository.create({ name: "Seeded" });
        const updated = await system_repository.update("team_existing", {
          name: "Seeded rename",
        });
        const deleted = await system_repository.delete_by_ids([
          "team_existing",
        ]);
        return created.success && updated.success && deleted.success;
      },
    );
    expect(scope_result).toEqual({ success: true, data: true });
    expect(await database.table("teams").count()).toBe(1);
    expect(await read_real_outbox_ids(database)).toEqual([]);
  });

  it("rejects a system-origin write after its scope has closed and writes nothing", async () => {
    const database = await open_database();
    const user_repository = create_origin_test_team_repository(database);
    const leaked_scopes: UntrackedWriteScope[] = [];
    const scope_result = await run_untracked_write_scope(
      sync_change_tracking_gate,
      UntrackedWriteReason.DATA_RESET,
      async (scope) => leaked_scopes.push(scope),
    );
    expect(scope_result.success).toBe(true);
    const late_repository = user_repository.with_write_origin(
      create_system_write_origin(leaked_scopes[0]),
    );
    const late_seed = await late_repository.seed_with_data([
      build_origin_test_team("team_late"),
    ]);
    const late_clear = await late_repository.clear_all_data();
    expect(late_seed).toEqual({
      success: false,
      error: REPOSITORY_WRITE_ORIGIN_MESSAGE.SYSTEM_SCOPE_CLOSED,
    });
    expect(late_clear.success).toBe(false);
    expect(await database.table("teams").count()).toBe(1);
    expect(await read_real_outbox_ids(database)).toEqual([]);
  });

  it("reports a missing entity on update and delete without writing anything", async () => {
    const database = await open_database();
    const user_repository = create_origin_test_team_repository(database);
    const not_found = {
      success: false,
      error: "Entity with id 'team_missing' not found",
    };
    expect(await user_repository.update("team_missing", {})).toEqual(not_found);
    expect(await user_repository.delete_by_id("team_missing")).toEqual(
      not_found,
    );
    expect(await read_real_outbox_ids(database)).toEqual([]);
  });
});
