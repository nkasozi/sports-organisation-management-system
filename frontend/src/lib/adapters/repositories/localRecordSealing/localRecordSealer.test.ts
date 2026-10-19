import type { DBCoreIndex, DBCoreTableSchema } from "dexie";
import { describe, expect, it } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  open_local_record,
  open_local_rows,
  seal_local_record,
} from "./localRecordSealer";
import { build_local_record_sealing_plan } from "./localRecordSealingPlan";
import { SEALED_RECORD_FIELD_NAME } from "./localRecordSealingTypes";

const DATA_KEY = new Uint8Array(32).fill(3);
const OTHER_DATA_KEY = new Uint8Array(32).fill(4);

function build_index(key_path: string | string[]): DBCoreIndex {
  return { name: String(key_path), keyPath: key_path, extractKey: () => 0 };
}

function build_schema(
  primary_key_path: string | string[],
  index_paths: (string | string[])[],
): DBCoreTableSchema {
  return {
    name: "teams",
    primaryKey: { ...build_index(primary_key_path), isPrimaryKey: true },
    indexes: index_paths.map(build_index),
    getIndexByKeyPath: () => build_index("id"),
  };
}

const TEAMS_PLAN = build_local_record_sealing_plan(
  build_schema("id", ["name", ["organization_id", "status"], "meta.slug"]),
);

const TEAM = {
  id: "team_1",
  name: "Lions",
  organization_id: "org_1",
  status: "active",
  meta: { slug: "lions", secret_note: "hidden" },
  coach_phone: "0700 000000",
};

describe("local record sealing plan", () => {
  it("lists primary key, index and compound member paths once, sorted", () => {
    expect(TEAMS_PLAN).toEqual({
      table_name: "teams",
      visible_field_paths: [
        "id",
        "meta.slug",
        "name",
        "organization_id",
        "status",
      ],
    });
  });

  it("supports outbound primary keys by using only index paths", () => {
    const schema = build_schema("id", ["name"]);
    const outbound_schema: DBCoreTableSchema = {
      ...schema,
      primaryKey: { ...schema.primaryKey, keyPath: [], outbound: true },
    };
    expect(
      build_local_record_sealing_plan(outbound_schema).visible_field_paths,
    ).toEqual(["name"]);
  });
});

describe("local record sealer", () => {
  it("keeps only indexed fields readable next to the sealed blob", () => {
    const sealed = seal_local_record(TEAMS_PLAN, DATA_KEY, TEAM);
    expect(sealed.success).toBe(true);
    if (!sealed.success) return;
    const row = sealed.data as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(
      [
        SEALED_RECORD_FIELD_NAME,
        "id",
        "meta",
        "name",
        "organization_id",
        "status",
      ].sort(),
    );
    expect(row.meta).toEqual({ slug: "lions" });
    expect(JSON.stringify(row)).not.toContain("0700");
  });

  it("opens a sealed row back into the full record", () => {
    const sealed = seal_local_record(TEAMS_PLAN, DATA_KEY, TEAM);
    if (!sealed.success) return expect.unreachable();
    expect(open_local_record(TEAMS_PLAN, DATA_KEY, sealed.data)).toEqual({
      status: OptionStatus.SOME,
      value: TEAM,
    });
  });

  it("refuses rows whose visible fields were edited", () => {
    const sealed = seal_local_record(TEAMS_PLAN, DATA_KEY, TEAM);
    if (!sealed.success) return expect.unreachable();
    const edited_row = { ...(sealed.data as object), status: "banned" };
    expect(open_local_record(TEAMS_PLAN, DATA_KEY, edited_row).status).toBe(
      OptionStatus.NONE,
    );
  });

  it("refuses rows sealed for another table", () => {
    const players_plan = { ...TEAMS_PLAN, table_name: "players" };
    const sealed = seal_local_record(players_plan, DATA_KEY, TEAM);
    if (!sealed.success) return expect.unreachable();
    expect(open_local_record(TEAMS_PLAN, DATA_KEY, sealed.data).status).toBe(
      OptionStatus.NONE,
    );
  });

  it("refuses plaintext rows and rows sealed with another key", () => {
    const sealed = seal_local_record(TEAMS_PLAN, OTHER_DATA_KEY, TEAM);
    if (!sealed.success) return expect.unreachable();
    expect(open_local_record(TEAMS_PLAN, DATA_KEY, sealed.data).status).toBe(
      OptionStatus.NONE,
    );
    expect(open_local_record(TEAMS_PLAN, DATA_KEY, TEAM).status).toBe(
      OptionStatus.NONE,
    );
  });

  it("opens rows into a sparse list, counting unreadable but not absent rows", () => {
    const sealed = seal_local_record(TEAMS_PLAN, DATA_KEY, TEAM);
    if (!sealed.success) return expect.unreachable();
    const missing_row = new Array<unknown>(1)[0];
    const opened = open_local_rows(TEAMS_PLAN, DATA_KEY, [
      sealed.data,
      TEAM,
      missing_row,
    ]);
    expect(opened.unreadable_count).toBe(1);
    expect(opened.values.length).toBe(3);
    expect(opened.values[0]).toEqual(TEAM);
    expect(1 in opened.values).toBe(false);
    expect(2 in opened.values).toBe(false);
  });
});
