import { describe, expect, it } from "vitest";

import { check_entity_authorized } from "./authorization_access_queries";
import { update_user_role } from "./authorization_mutations";
import { can_access_route } from "./authorization_navigation_queries";
import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  type FakeIdentity,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
  STRANGER_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { clear_table } from "./sync_admin_mutations";
import { batch_delete } from "./sync_batch_delete_mutation";
import { batch_upsert, MAX_BATCH_SIZE } from "./sync_batch_mutation";
import { get_changes_page } from "./sync_change_queries";

const ACCESS_DENIED_FAILURE = {
  success: false,
  error_code: "access_denied",
  error: "Access denied",
};

function context_for(identity: FakeIdentity): FakeConvexContext {
  return create_fake_convex_context({
    identity,
    tables: { system_users: ALL_FIXTURE_USERS, teams: [] },
  });
}

async function call(
  handler: unknown,
  identity: FakeIdentity,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return invoke_convex_handler<Record<string, unknown>>(
    handler,
    context_for(identity),
    args,
  );
}

describe("uniform access denied failures (R39)", () => {
  it("returns the same code and message for every role-change denial", async () => {
    const denials = [
      await call(update_user_role, ANONYMOUS_IDENTITY, {
        target_email: ORGANIZATION_A_PLAYER_EMAIL,
        role: "team_manager",
      }),
      await call(
        update_user_role,
        authenticated_identity(ORGANIZATION_A_PLAYER_EMAIL),
        { target_email: ORGANIZATION_A_PLAYER_EMAIL, role: "team_manager" },
      ),
      await call(
        update_user_role,
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
        { target_email: STRANGER_EMAIL, role: "team_manager" },
      ),
      await call(
        update_user_role,
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
        { target_email: ORGANIZATION_A_PLAYER_EMAIL, role: "super_admin" },
      ),
    ];
    for (const denial of denials) expect(denial).toEqual(ACCESS_DENIED_FAILURE);
  });

  it("hides the denial reason for batch writes and route checks", async () => {
    const player = authenticated_identity(ORGANIZATION_A_PLAYER_EMAIL);
    const delete_args = { table_name: "teams", records: [] };
    expect(
      await call(batch_delete, ANONYMOUS_IDENTITY, delete_args),
    ).toMatchObject(ACCESS_DENIED_FAILURE);
    expect(await call(batch_delete, player, delete_args)).toMatchObject(
      ACCESS_DENIED_FAILURE,
    );
    expect(
      await call(clear_table, player, { table_name: "teams" }),
    ).toMatchObject(ACCESS_DENIED_FAILURE);
    expect(
      await call(can_access_route, player, { route: "/not-a-real-route" }),
    ).toEqual(ACCESS_DENIED_FAILURE);
  });
});

describe("stable failure codes for invalid requests", () => {
  it("reports an unknown table with a user-safe message", async () => {
    const admin = authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await call(get_changes_page, admin, {
      table_name: "secret_table",
      after_sequence: 0,
    });
    expect(result).toMatchObject({
      success: false,
      error_code: "invalid_table",
    });
    expect(String(result.error)).not.toContain("secret_table");
  });

  it("reports oversized batches before doing any work", async () => {
    const records = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, index) => ({
      local_id: `team_${index}`,
      data: {},
      version: 1,
    }));
    const result = await call(
      batch_upsert,
      authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      { table_name: "teams", records },
    );
    expect(result).toMatchObject({
      success: false,
      error_code: "batch_too_large",
    });
    expect(String(result.error)).not.toContain(String(MAX_BATCH_SIZE + 1));
  });

  it("explains an unknown action without leaking role details", async () => {
    const result = await call(
      check_entity_authorized,
      authenticated_identity(ORGANIZATION_A_PLAYER_EMAIL),
      { entity_type: "team", action: "explode" },
    );
    expect(result).toMatchObject({
      success: true,
      data: { is_authorized: false },
    });
  });
});
