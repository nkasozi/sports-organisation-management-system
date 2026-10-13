import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
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

type MutationResult = { success: boolean; action?: string; error?: string };

function create_context_for(
  email: string,
  teams: Record<string, unknown>[],
): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: { system_users: ALL_FIXTURE_USERS, teams },
  });
}

describe("upsert_record versioning", () => {
  it("rejects an inflated client version instead of letting it win", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_a", ORGANIZATION_A_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_a",
        data: {
          ...build_team_record("team_a", ORGANIZATION_A_ID, 1),
          name: "Clobbered",
        },
        version: 1_000_000_000,
      },
    );
    expect(result).toMatchObject({
      success: false,
      action: "conflict_detected",
    });
    expect(find_table_rows(context, "teams")[0]).toMatchObject({
      name: "Team team_a",
      version: 1,
    });
  });
});
