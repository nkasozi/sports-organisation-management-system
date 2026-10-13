import { describe, expect, it } from "vitest";

import schema from "../schema";
import { ALLOWED_SYNC_TABLES, is_global_table } from "./sync_validation";
import {
  get_table_tenancy_strategy,
  TABLE_TENANCY_STRATEGIES,
  TableTenancyStrategy,
} from "./table_tenancy";

const ORGANIZATION_FIELD_NAME = "organization_id";

function table_has_organization_field(table_name: string): boolean {
  const table_definition = Reflect.get(schema.tables, table_name) as {
    validator: { fields: Record<string, unknown> };
  };
  return ORGANIZATION_FIELD_NAME in table_definition.validator.fields;
}

describe("table tenancy strategies", () => {
  it("classifies exactly the allowed sync tables", () => {
    expect(Object.keys(TABLE_TENANCY_STRATEGIES).sort()).toEqual(
      [...ALLOWED_SYNC_TABLES].sort(),
    );
  });

  it.each([...ALLOWED_SYNC_TABLES])(
    "classifies %s consistently with the schema and global tables",
    (table_name) => {
      const strategy = get_table_tenancy_strategy(table_name);
      const has_organization_field = table_has_organization_field(table_name);
      switch (strategy) {
        case TableTenancyStrategy.SHARED_REFERENCE:
          expect(is_global_table(table_name)).toBe(true);
          return;
        case TableTenancyStrategy.ORGANIZATION_FIELD:
          expect(is_global_table(table_name)).toBe(false);
          expect(has_organization_field).toBe(true);
          return;
        case TableTenancyStrategy.ORGANIZATION_IDENTITY:
        case TableTenancyStrategy.PARENT_SCOPED:
          expect(is_global_table(table_name)).toBe(false);
          expect(has_organization_field).toBe(false);
          return;
      }
    },
  );

  it("treats the organizations table as identified by its own local id", () => {
    expect(get_table_tenancy_strategy("organizations")).toBe(
      TableTenancyStrategy.ORGANIZATION_IDENTITY,
    );
  });
});
