import type Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { local_data_key_holder } from "$lib/infrastructure/localVault/localDataKeyHolder";
import { local_record_tamper_notifier } from "$lib/infrastructure/localVault/localRecordTamperNotifier";
import type { LocalRecordTamperReport } from "$lib/infrastructure/localVault/localVaultContracts";

import type { SportSyncDatabase } from "../database";
import {
  create_test_database_name,
  open_real_test_database,
} from "../syncOutbox/realDexieDatabase.test_support";
import {
  open_raw_test_database,
  remember_test_local_data_key,
} from "./localRecordSealing.test_support";
import { SEALED_RECORD_FIELD_NAME } from "./localRecordSealingTypes";

const opened_databases: Dexie[] = [];
const tamper_reports: LocalRecordTamperReport[] = [];
let stop_listening: () => void = () => false;

const TEAM_ONE = { id: "team_1", name: "Lions", coach_phone: "0700 111111" };
const TEAM_TWO = { id: "team_2", name: "Tigers", coach_phone: "0700 222222" };

interface SealedPair {
  teams: Dexie.Table;
  raw_teams: Dexie.Table;
  settings: SportSyncDatabase["app_settings"];
}

async function open_seeded_pair(): Promise<SealedPair> {
  const database_name = create_test_database_name();
  const database = open_real_test_database(database_name);
  await database.table("teams").bulkPut([TEAM_ONE, TEAM_TWO]);
  const raw_database = await open_raw_test_database(database_name);
  opened_databases.push(raw_database, database);
  return {
    teams: database.table("teams"),
    raw_teams: raw_database.table("teams"),
    settings: database.app_settings,
  };
}

async function read_raw(
  raw_teams: Dexie.Table,
  team_id: string,
): Promise<Record<string, unknown>> {
  return (await raw_teams.get(team_id)) as Record<string, unknown>;
}

function flip_last_byte(sealed: unknown): Uint8Array {
  const altered = new Uint8Array(sealed as Uint8Array);
  altered[altered.length - 1] ^= 1;
  return altered;
}

beforeEach(() => {
  remember_test_local_data_key();
  tamper_reports.length = 0;
  stop_listening = local_record_tamper_notifier.subscribe((report) =>
    tamper_reports.push(report),
  );
});

afterEach(async () => {
  stop_listening();
  remember_test_local_data_key();
  for (const database of opened_databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("local record sealing tamper detection", () => {
  it("hides a row whose sealed bytes were altered and reports it", async () => {
    const { teams, raw_teams } = await open_seeded_pair();
    const raw_team = await read_raw(raw_teams, "team_1");
    await raw_teams.put({
      ...raw_team,
      [SEALED_RECORD_FIELD_NAME]: flip_last_byte(
        raw_team[SEALED_RECORD_FIELD_NAME],
      ),
    });
    expect(await teams.get("team_1")).toBeUndefined();
    expect(await teams.toArray()).toEqual([TEAM_TWO]);
    expect(tamper_reports.map((report) => report.table_name)).toEqual([
      "teams",
      "teams",
    ]);
  });

  it("hides a row whose readable indexed field was edited", async () => {
    const { teams, raw_teams } = await open_seeded_pair();
    const raw_team = await read_raw(raw_teams, "team_1");
    await raw_teams.put({ ...raw_team, name: "Champions" });
    expect(await teams.where("name").equals("Champions").toArray()).toEqual([]);
    expect(await teams.bulkGet(["team_1", "team_2"])).toEqual([
      new Array<unknown>(1)[0],
      TEAM_TWO,
    ]);
    const visited: string[] = [];
    await teams.each((team) => visited.push(team.id));
    expect(visited).toEqual(["team_2"]);
    expect(tamper_reports.map((report) => report.record_count)).toEqual([
      1, 1, 1,
    ]);
  });

  it("hides rows whose sealed blobs were swapped between records", async () => {
    const { teams, raw_teams } = await open_seeded_pair();
    const raw_one = await read_raw(raw_teams, "team_1");
    const raw_two = await read_raw(raw_teams, "team_2");
    await raw_teams.bulkPut([
      { ...raw_one, [SEALED_RECORD_FIELD_NAME]: raw_two.__sealed },
      { ...raw_two, [SEALED_RECORD_FIELD_NAME]: raw_one.__sealed },
    ]);
    expect(await teams.toArray()).toEqual([]);
    expect(tamper_reports).toHaveLength(1);
    expect(tamper_reports[0].record_count).toBe(2);
  });

  it("hides plaintext rows written around the database layer", async () => {
    const { teams, raw_teams } = await open_seeded_pair();
    await raw_teams.put({ id: "team_forged", name: "Forged" });
    expect(await teams.get("team_forged")).toBeUndefined();
    expect(await teams.count()).toBe(3);
  });

  it("ignores plaintext fields added next to the sealed record", async () => {
    const { teams, raw_teams } = await open_seeded_pair();
    const raw_team = await read_raw(raw_teams, "team_1");
    await raw_teams.put({ ...raw_team, coach_phone: "0700 000000" });
    expect(await teams.get("team_1")).toEqual(TEAM_ONE);
    expect(tamper_reports).toEqual([]);
  });
});

describe("local record sealing while locked", () => {
  it("rejects reads and writes but still counts", async () => {
    const { teams } = await open_seeded_pair();
    local_data_key_holder.forget();
    await expect(teams.get("team_1")).rejects.toThrow(/locked/);
    await expect(teams.toArray()).rejects.toThrow(/locked/);
    await expect(teams.bulkGet(["team_1"])).rejects.toThrow(/locked/);
    await expect(teams.put(TEAM_ONE)).rejects.toThrow(/locked/);
    await expect(teams.each(() => true)).rejects.toThrow(/locked/);
    expect(await teams.count()).toBe(2);
  });

  it("still deletes untracked rows, which needs no sealed outbox entry", async () => {
    const { settings } = await open_seeded_pair();
    await settings.put({ key: "theme", value: "dark" });
    local_data_key_holder.forget();
    await settings.delete("theme");
    expect(await settings.count()).toBe(0);
  });

  it("refuses records sealed with a different key", async () => {
    const { teams } = await open_seeded_pair();
    local_data_key_holder.remember(new Uint8Array(32).fill(1));
    expect(await teams.toArray()).toEqual([]);
    expect(tamper_reports[0].record_count).toBe(2);
  });
});
