import type Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

const TEAM_ONE = {
  id: "team_1",
  name: "Lions",
  organization_id: "org_1",
  coach_phone: "0700 111111",
  created_at: "2026-01-01",
};
const TEAM_TWO = {
  id: "team_2",
  name: "Tigers",
  organization_id: "org_1",
  coach_phone: "0700 222222",
  created_at: "2026-01-02",
};

interface SealedPair {
  database: SportSyncDatabase;
  raw_database: Dexie;
}

async function open_sealed_pair(): Promise<SealedPair> {
  const database_name = create_test_database_name();
  const database = open_real_test_database(database_name);
  await database.open();
  const raw_database = await open_raw_test_database(database_name);
  opened_databases.push(raw_database, database);
  return { database, raw_database };
}

async function open_seeded_pair(): Promise<SealedPair> {
  const pair = await open_sealed_pair();
  await pair.database.table("teams").bulkPut([TEAM_ONE, TEAM_TWO]);
  return pair;
}

async function read_raw_team(
  raw_database: Dexie,
  team_id: string,
): Promise<Record<string, unknown>> {
  return (await raw_database.table("teams").get(team_id)) as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  remember_test_local_data_key();
  tamper_reports.length = 0;
  const unsubscribe = local_record_tamper_notifier.subscribe((report) =>
    tamper_reports.push(report),
  );
  stop_listening = unsubscribe;
});

afterEach(async () => {
  stop_listening();
  remember_test_local_data_key();
  for (const database of opened_databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("local record sealing at rest", () => {
  it("stores only indexed fields in plaintext next to the sealed record", async () => {
    const { raw_database } = await open_seeded_pair();
    const raw_team = await read_raw_team(raw_database, "team_1");
    expect(Object.keys(raw_team).sort()).toEqual([
      SEALED_RECORD_FIELD_NAME,
      "created_at",
      "id",
      "name",
      "organization_id",
    ]);
    expect(raw_team[SEALED_RECORD_FIELD_NAME]).toBeInstanceOf(Uint8Array);
    expect(JSON.stringify(raw_team)).not.toContain("0700");
  });

  it("seals the sync outbox written by the outbox middleware too", async () => {
    const { database, raw_database } = await open_seeded_pair();
    const outbox = await database.table("sync_outbox").toArray();
    expect(outbox.map((entry) => entry.local_id).sort()).toEqual([
      "team_1",
      "team_2",
    ]);
    const raw_outbox = await raw_database.table("sync_outbox").toArray();
    expect(raw_outbox.every((row) => SEALED_RECORD_FIELD_NAME in row)).toBe(
      true,
    );
    expect(JSON.stringify(raw_outbox)).not.toContain("change_token");
  });
});

describe("local record sealing round trips", () => {
  it("reads through get, bulkGet, toArray, where, orderBy and each", async () => {
    const { database } = await open_seeded_pair();
    const teams = database.table("teams");
    expect(await teams.get("team_1")).toEqual(TEAM_ONE);
    expect(await teams.bulkGet(["team_2", "missing"])).toEqual([
      TEAM_TWO,
      new Array<unknown>(1)[0],
    ]);
    expect(await teams.toArray()).toEqual([TEAM_ONE, TEAM_TWO]);
    expect(
      await teams.where("organization_id").equals("org_1").sortBy("name"),
    ).toEqual([TEAM_ONE, TEAM_TWO]);
    expect(await teams.orderBy("name").reverse().first()).toEqual(TEAM_TWO);
    expect(
      await teams.filter((team) => team.coach_phone.endsWith("2")).toArray(),
    ).toEqual([TEAM_TWO]);
    const visited: string[] = [];
    await teams.each((team) => visited.push(team.coach_phone));
    expect(visited).toEqual([TEAM_ONE.coach_phone, TEAM_TWO.coach_phone]);
    expect(await teams.count()).toBe(2);
    expect(await teams.toCollection().primaryKeys()).toEqual([
      "team_1",
      "team_2",
    ]);
  });

  it("writes through update, modify, bulkPut and delete", async () => {
    const { database } = await open_seeded_pair();
    const teams = database.table("teams");
    await teams.update("team_1", { coach_phone: "0700 999999" });
    await teams.where("name").equals("Tigers").modify({ name: "Tigers FC" });
    await teams.bulkPut([{ ...TEAM_ONE, id: "team_3" }]);
    await teams.delete("team_3");
    expect(await teams.toArray()).toEqual([
      { ...TEAM_ONE, coach_phone: "0700 999999" },
      { ...TEAM_TWO, name: "Tigers FC" },
    ]);
    expect(await teams.where("name").equals("Tigers FC").count()).toBe(1);
  });

  it("runs reads and writes inside one transaction", async () => {
    const { database } = await open_seeded_pair();
    const renamed = await database.transaction("rw", ["teams"], async () => {
      const team = await database.table("teams").get("team_1");
      await database.table("teams").put({ ...team, name: "Lions II" });
      return database.table("teams").get("team_1");
    });
    expect(renamed).toEqual({ ...TEAM_ONE, name: "Lions II" });
  });
});
