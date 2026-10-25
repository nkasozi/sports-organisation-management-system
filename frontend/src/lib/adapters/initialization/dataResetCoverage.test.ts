import { describe, expect, it } from "vitest";

import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTableNames";

import { list_reset_table_names } from "./dataResetRepositoryResets";

describe("Reset Demo Data clears every data table", () => {
  it("covers each synced table so nothing from an old demo survives", () => {
    const reset_tables = new Set(list_reset_table_names());
    expect(TABLE_NAMES.filter((table) => !reset_tables.has(table))).toEqual([]);
  });
});
