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
  build_player_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { clear_table } from "./sync_admin_mutations";

type ClearResult = { success: boolean; deleted_count: number };

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      players: [build_player_record("player_a", ORGANIZATION_A_ID)],
      player_profiles: [{ local_id: "profile_a", player_id: "player_a" }],
      profile_links: [{ local_id: "link_a", profile_id: "profile_a" }],
    },
  });
}

describe("clear_table role restriction", () => {
  it("refuses clear_table for non-administrator roles even with delete rights", async () => {
    const context = create_context(ORGANIZATION_A_PLAYER_EMAIL);
    const result = await invoke_convex_handler<ClearResult>(
      clear_table,
      context,
      { table_name: "profile_links" },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "profile_links")).toHaveLength(1);
  });

  it("still lets org admins clear their organization's records", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await invoke_convex_handler<ClearResult>(
      clear_table,
      context,
      { table_name: "profile_links" },
    );
    expect(result).toMatchObject({ success: true, deleted_count: 1 });
  });
});
