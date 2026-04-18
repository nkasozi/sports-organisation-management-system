import { describe, expect, it } from "vitest";

import {
  get_push_excluded_tables_for_unsigned_user,
  TABLE_NAMES,
} from "./syncTypes";

describe("syncTypes", () => {
  it("returns every synced table when no role is available", () => {
    const excluded_tables = get_push_excluded_tables_for_unsigned_user();

    expect([...excluded_tables]).toEqual([...TABLE_NAMES]);
  });
});
