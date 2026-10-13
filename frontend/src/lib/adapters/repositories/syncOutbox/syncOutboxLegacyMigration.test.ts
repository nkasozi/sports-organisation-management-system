import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import {
  create_test_database_name,
  open_real_test_database,
  read_real_outbox,
  read_real_outbox_ids,
} from "./realDexieDatabase.test_support";
import { LEGACY_SYNC_METADATA_SETTING_KEY } from "./syncOutboxLegacyMigration";

const LEGACY_SCHEMA_VERSION = 7;
const created_database_names: string[] = [];

async function create_legacy_database(): Promise<string> {
  const database_name = create_test_database_name();
  created_database_names.push(database_name);
  const legacy = new Dexie(database_name);
  legacy.version(LEGACY_SCHEMA_VERSION).stores({
    teams: "id, name",
    players: "id",
    app_settings: "key",
    audit_logs: "id",
  });
  await legacy.table("teams").bulkPut([
    { id: "team_offline_edit", name: "Edited offline" },
    { id: "team_synced", name: "Synced" },
  ]);
  await legacy.table("players").put({ id: "player_offline" });
  await legacy.table("audit_logs").put({ id: "audit_1" });
  await legacy.table("app_settings").bulkPut([
    { key: LEGACY_SYNC_METADATA_SETTING_KEY, value: "{}" },
    { key: "theme", value: "dark" },
  ]);
  legacy.close();
  return database_name;
}

afterEach(async () => {
  for (const database_name of created_database_names.splice(0))
    await Dexie.delete(database_name);
});

describe("v8 legacy outbox migration", () => {
  it("enqueues every pre-existing record of a synced table so offline edits get pushed", async () => {
    const database = open_real_test_database(await create_legacy_database());
    await database.open();

    expect(await read_real_outbox_ids(database)).toEqual([
      "players:player_offline",
      "teams:team_offline_edit",
      "teams:team_synced",
    ]);
    const entries = await read_real_outbox(database);
    expect(entries.every((entry) => entry.status === "pending")).toBe(true);
    expect(
      entries.every((entry) => entry.base_version.kind === "unknown"),
    ).toBe(true);
    database.close();
  });

  it("removes the legacy sync metadata key and keeps other settings", async () => {
    const database = open_real_test_database(await create_legacy_database());
    await database.open();

    expect(
      await database
        .table("app_settings")
        .get(LEGACY_SYNC_METADATA_SETTING_KEY),
    ).toBe(undefined);
    expect(await database.table("app_settings").get("theme")).toEqual({
      key: "theme",
      value: "dark",
    });
    database.close();
  });

  it("does not enqueue anything when the database is created fresh", async () => {
    const database_name = create_test_database_name();
    created_database_names.push(database_name);
    const database = open_real_test_database(database_name);
    await database.open();

    expect(await read_real_outbox_ids(database)).toEqual([]);
    database.close();
  });
});
