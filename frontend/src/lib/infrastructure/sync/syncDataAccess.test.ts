import { describe, expect, it, vi } from "vitest";

import type { SportSyncDatabase } from "../../adapters/repositories/database";
import { get_table_from_database } from "./syncDataAccess";
import { TABLE_NAMES } from "./syncTypes";

vi.mock("../../adapters/repositories/database", () => ({
  get_database: () => ({}),
}));

function create_fake_database(): SportSyncDatabase {
  return Object.fromEntries(
    TABLE_NAMES.map((table_name) => [table_name, { name: table_name }]),
  ) as unknown as SportSyncDatabase;
}

describe("get_table_from_database", () => {
  it("returns the database table matching every sync table name", () => {
    const database = create_fake_database();

    for (const table_name of TABLE_NAMES) {
      expect(get_table_from_database(database, table_name)).toBe(
        (database as unknown as Record<string, unknown>)[table_name],
      );
    }
  });
});
