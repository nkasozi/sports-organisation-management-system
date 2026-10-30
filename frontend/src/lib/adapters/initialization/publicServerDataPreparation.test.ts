import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import { open_real_test_database } from "$lib/adapters/repositories/syncOutbox/realDexieDatabase.test_support";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  SEEDING_COMPLETE_SETTING_KEY,
  SEEDING_COMPLETION_STATE,
  type SeedingCompletionState,
} from "./initializationConstants";
import { prepare_public_server_data } from "./publicServerDataPreparation";

const PUBLIC_ORG_SETTING_KEY = "sports-org-public-org-id";

const test_state = vi.hoisted(() => ({
  database: undefined as unknown as SportSyncDatabase,
  completion: "not_complete" as SeedingCompletionState,
}));

vi.mock("$lib/adapters/repositories/database", async (import_original) => ({
  ...(await import_original<object>()),
  get_database: () => test_state.database,
}));
vi.mock("./seedingTypes", () => ({
  is_seeding_already_complete: async () => test_state.completion,
}));

async function write_untracked(
  store_name: string,
  record: Record<string, unknown>,
): Promise<void> {
  await test_state.database.transaction("rw", [store_name], (transaction) => {
    sync_change_tracking_gate.mark_untracked_transaction(
      transaction.idbtrans,
      UntrackedWriteReason.DEMO_SEED,
    );
    transaction.idbtrans.objectStore(store_name).put(record);
  });
}

async function seed_demo_device(): Promise<void> {
  await write_untracked("teams", { id: "team_demo", name: "Demo Lions" });
  await test_state.database.app_settings.bulkPut([
    { key: SEEDING_COMPLETE_SETTING_KEY, value: "true" },
    { key: PUBLIC_ORG_SETTING_KEY, value: "org_real" },
  ]);
}

async function read_setting_keys(): Promise<string[]> {
  return (await test_state.database.app_settings.toArray())
    .map((row) => row.key)
    .sort();
}

describe("signed-out visitors on a site with a server see only real data", () => {
  beforeEach(async () => {
    test_state.database = open_real_test_database();
    await test_state.database.open();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await seed_demo_device();
  });

  it("clears demo data left on the device and keeps the chosen organization", async () => {
    test_state.completion = SEEDING_COMPLETION_STATE.COMPLETE;

    const result = await prepare_public_server_data();

    expect(result).toMatchObject({ success: true, outcome: "skipped" });
    expect(await test_state.database.teams.count()).toBe(0);
    expect(await read_setting_keys()).toEqual([PUBLIC_ORG_SETTING_KEY]);
    expect(await test_state.database.sync_outbox.count()).toBe(0);
  });

  it("leaves a device without demo data alone", async () => {
    test_state.completion = SEEDING_COMPLETION_STATE.NOT_COMPLETE;

    const result = await prepare_public_server_data();

    expect(result).toMatchObject({ success: true, outcome: "skipped" });
    expect(await test_state.database.teams.count()).toBe(1);
  });

  it("keeps everything when the device holds changes never sent to the server", async () => {
    test_state.completion = SEEDING_COMPLETION_STATE.COMPLETE;
    await write_untracked("sync_outbox", {
      table_name: "teams",
      local_id: "team_demo",
    });

    const result = await prepare_public_server_data();

    expect(result).toMatchObject({ success: false, outcome: "failed" });
    expect(await test_state.database.teams.count()).toBe(1);
  });
});
