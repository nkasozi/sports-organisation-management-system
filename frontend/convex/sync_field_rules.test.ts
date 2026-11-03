import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";
import { upsert_record } from "./sync_basic_mutations";

type MutationResult = { success: boolean; error?: string };

async function save_team(
  extra_fields: Record<string, unknown>,
): Promise<{ result: MutationResult; saved: Record<string, unknown>[] }> {
  const context = create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: { system_users: ALL_FIXTURE_USERS, teams: [] },
  });
  const result = await invoke_convex_handler<MutationResult>(
    upsert_record,
    context,
    {
      table_name: "teams",
      local_id: "team_fields",
      data: {
        ...build_team_record("team_fields", ORGANIZATION_A_ID, 1),
        ...extra_fields,
      },
      version: 1,
    },
  );
  return { result, saved: find_table_rows(context, "teams") };
}

describe("the server checks filled-in fields with the same rules as the app", () => {
  it("saves a record whose fields are fine or left empty", async () => {
    const { result, saved } = await save_team({
      short_name: "KCC",
      max_squad_size: 25,
      contact_phone: "",
    });
    expect(result.success).toBe(true);
    expect(saved[0].short_name).toBe("KCC");
  });

  it("refuses a record with a value in the wrong format or out of range", async () => {
    const { result, saved } = await save_team({
      max_squad_size: 5_000,
      primary_color: "blue",
    });
    expect(result.success).toBe(false);
    expect(saved).toHaveLength(0);
  });
});
