import { describe, expect, it } from "vitest";

import { PUBLIC_TABLE_NAMES } from "./sync_validation";

const PUBLIC_REFERENCE_DEPENDENCIES: ReadonlyArray<{
  public_table: string;
  reference_field: string;
  referenced_table: string;
}> = [
  {
    public_table: "organizations",
    reference_field: "sport_id",
    referenced_table: "sports",
  },
];

describe("public tables include the reference data they point at", () => {
  it.each(PUBLIC_REFERENCE_DEPENDENCIES)(
    "$public_table.$reference_field can be resolved from public $referenced_table",
    ({ public_table, referenced_table }) => {
      const public_tables: readonly string[] = PUBLIC_TABLE_NAMES;

      expect(public_tables).toContain(public_table);
      expect(public_tables).toContain(referenced_table);
    },
  );
});
