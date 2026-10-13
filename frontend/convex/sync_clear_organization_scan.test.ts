import { describe, expect, it } from "vitest";

import {
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import {
  type ClearJobResponse,
  create_clear_context,
  sequenced_teams,
} from "./lib/sync_clear_job_fixtures.test_support";
import {
  TABLE_TENANCY_STRATEGIES,
  TableTenancyStrategy,
} from "./lib/table_tenancy";
import schema from "./schema";
import {
  ORGANIZATION_LOCAL_ID_INDEX_FIELDS,
  ORGANIZATION_LOCAL_ID_INDEX_NAME,
} from "./schema_validators";
import { clear_table } from "./sync_admin_mutations";

interface SchemaIndex {
  indexDescriptor: string;
  fields: string[];
}

function read_table_indexes(table_name: string): SchemaIndex[] {
  const table_definition = (
    schema.tables as unknown as Record<string, { " indexes"(): SchemaIndex[] }>
  )[table_name];
  return table_definition[" indexes"]();
}

describe("organization scoped clear scans", () => {
  it("define an organization and local id index on every organization owned table", () => {
    const organization_owned_tables = Object.entries(TABLE_TENANCY_STRATEGIES)
      .filter(
        ([, strategy]) => strategy === TableTenancyStrategy.ORGANIZATION_FIELD,
      )
      .map(([table_name]) => table_name);
    for (const table_name of organization_owned_tables)
      expect(read_table_indexes(table_name), table_name).toContainEqual({
        indexDescriptor: ORGANIZATION_LOCAL_ID_INDEX_NAME,
        fields: [...ORGANIZATION_LOCAL_ID_INDEX_FIELDS],
      });
  });

  it("only scan the caller organization so a small org finishes in one slice", async () => {
    const context = create_clear_context(ORGANIZATION_A_ADMIN_EMAIL, {
      teams: [
        ...sequenced_teams("alpha_b", ORGANIZATION_B_ID, 250),
        ...sequenced_teams("team_a", ORGANIZATION_A_ID, 2),
      ],
    });
    const result = await invoke_convex_handler<ClearJobResponse>(
      clear_table,
      context,
      { table_name: "teams" },
    );
    expect(result).toMatchObject({ deleted_count: 2, job_status: "completed" });
    expect(
      context.scheduled_calls.map((call) => call.function_arguments.job_id),
    ).not.toContain(result.job_id);
    expect(find_table_rows(context, "teams")).toHaveLength(250);
  });
});
