import { describe, expect, it } from "vitest";

import { build_table_query } from "./fake_convex_query.test_support";
import {
  ParentResolutionKind,
  resolve_parent_organization,
} from "./parent_organization_resolution";
import {
  create_database_parent_row_loader,
  load_parent_record_lookup,
} from "./parent_record_loading";

const STORED_ROWS: Record<string, Array<Record<string, unknown>>> = {
  players: [{ local_id: "player_a", organization_id: "org_a" }],
  player_profiles: [
    { local_id: "player_profile_a", player_id: "player_a" },
    { local_id: "player_profile_b", player_id: "player_b" },
  ],
  team_profiles: [],
};

function create_counting_loader(): {
  requested_tables: string[];
  load_rows: (
    table_name: string,
    local_ids: string[],
  ) => Promise<Array<Record<string, unknown>>>;
} {
  const requested_tables: string[] = [];
  return {
    requested_tables,
    load_rows: async (
      table_name: string,
      local_ids: string[],
    ): Promise<Array<Record<string, unknown>>> => {
      requested_tables.push(table_name);
      return (STORED_ROWS[table_name] ?? []).filter((row) =>
        local_ids.includes(String(row.local_id)),
      );
    },
  };
}

describe("load_parent_record_lookup", () => {
  it("loads each referenced parent table once, following nested parents", async () => {
    const loader = create_counting_loader();
    const records = [
      { profile_id: "player_profile_a" },
      { profile_id: "player_profile_b" },
      { profile_id: "player_profile_a" },
    ];
    const lookup = await load_parent_record_lookup(
      loader,
      "profile_links",
      records,
    );
    expect([...loader.requested_tables].sort()).toEqual([
      "player_profiles",
      "players",
      "team_profiles",
    ]);
    expect(
      resolve_parent_organization("profile_links", records[0], lookup),
    ).toEqual({
      kind: ParentResolutionKind.RESOLVED_ORGANIZATION,
      organization_id: "org_a",
    });
    expect(
      resolve_parent_organization("profile_links", records[1], lookup).kind,
    ).toBe(ParentResolutionKind.PARENT_NOT_FOUND);
  });

  it("skips loading when no record references a parent", async () => {
    const loader = create_counting_loader();
    await load_parent_record_lookup(loader, "competition_stages", [{}]);
    expect(loader.requested_tables).toEqual([]);
  });
});

function create_recording_database(rows: Array<Record<string, unknown>>): {
  calls: { full_scans: number; indexed_lookups: number };
  database: unknown;
} {
  const calls = { full_scans: 0, indexed_lookups: 0 };
  const database = {
    query: () => {
      const table_query = build_table_query(
        rows.map((row, index) => ({ _id: `row_${index}`, ...row })),
      );
      return {
        ...table_query,
        collect: async () => {
          calls.full_scans += 1;
          return table_query.collect();
        },
        withIndex: (
          index_name: string,
          predicate: Parameters<typeof table_query.withIndex>[1],
        ) => {
          calls.indexed_lookups += 1;
          return table_query.withIndex(index_name, predicate);
        },
      };
    },
  };
  return { calls, database };
}

describe("create_database_parent_row_loader", () => {
  it("uses indexed lookups instead of full table scans for large id sets", async () => {
    const stored_rows = Array.from({ length: 30 }, (_, index) => ({
      local_id: `team_${index}`,
      organization_id: "org_a",
    }));
    const { calls, database } = create_recording_database(stored_rows);
    const loader = create_database_parent_row_loader({
      db: database as never,
    });
    const requested_ids = [
      ...stored_rows.slice(0, 25).map((row) => row.local_id),
      "team_missing",
      "team_0",
    ];
    const loaded_rows = await loader.load_rows("teams", requested_ids);
    expect(calls.full_scans).toBe(0);
    expect(calls.indexed_lookups).toBe(26);
    expect(loaded_rows.map((row) => row.local_id).sort()).toEqual(
      stored_rows
        .slice(0, 25)
        .map((row) => row.local_id)
        .sort(),
    );
  });
});
