import { describe, expect, it } from "vitest";

import { update_user_role } from "./authorization_mutations";
import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  get_scheduled_event_types,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import { SecurityEventType } from "./lib/security_event_types";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";

type MutationResult = { success: boolean; error?: string };

const REFERENCE_TABLES = {
  teams: [
    { local_id: "team_a", organization_id: ORGANIZATION_A_ID },
    { local_id: "team_b", organization_id: ORGANIZATION_B_ID },
  ],
  players: [
    { local_id: "player_a", organization_id: ORGANIZATION_A_ID },
    { local_id: "player_b", organization_id: ORGANIZATION_B_ID },
  ],
  officials: [
    { local_id: "official_a", organization_id: ORGANIZATION_A_ID },
    { local_id: "official_b", organization_id: ORGANIZATION_B_ID },
  ],
};

async function change_role(
  caller_email: string,
  command: Record<string, unknown>,
): Promise<{
  context: FakeConvexContext;
  result: MutationResult;
  target: Record<string, unknown>;
}> {
  const context = create_fake_convex_context({
    identity: authenticated_identity(caller_email),
    tables: { system_users: ALL_FIXTURE_USERS, ...REFERENCE_TABLES },
  });
  const result = await invoke_convex_handler<MutationResult>(
    update_user_role,
    context,
    { target_email: ORGANIZATION_A_PLAYER_EMAIL, ...command },
  );
  const target =
    find_table_rows(context, "system_users").find(
      (row) => row.email === ORGANIZATION_A_PLAYER_EMAIL,
    ) ?? {};
  return { context, result, target };
}

describe("update_user_role reference ownership", () => {
  it("accepts team, player and official ids owned by the target organization", async () => {
    const { result, target } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      role: "team_manager",
      team_id: "team_a",
      player_id: "player_a",
      official_id: "official_a",
    });
    expect(result.success).toBe(true);
    expect(target).toMatchObject({
      team_id: "team_a",
      player_id: "player_a",
      official_id: "official_a",
    });
  });

  it.each([
    ["team_id", "team_b"],
    ["player_id", "player_b"],
    ["official_id", "official_b"],
    ["team_id", "team_missing"],
    ["team_id", "*"],
  ])(
    "rejects %s %s that is not owned by the target organization",
    async (field_name, reference_value) => {
      const { context, result, target } = await change_role(
        ORGANIZATION_A_ADMIN_EMAIL,
        { role: "team_manager", [field_name]: reference_value },
      );
      expect(result.success).toBe(false);
      expect(target?.role).toBe("player");
      expect(target?.[field_name]).toBeUndefined();
      expect(get_scheduled_event_types(context)).toContain(
        SecurityEventType.ORG_SCOPE_VIOLATION,
      );
    },
  );

  it("rejects carrying an old team into a new organization", async () => {
    const context = create_fake_convex_context({
      identity: authenticated_identity(SUPER_ADMIN_EMAIL),
      tables: {
        system_users: ALL_FIXTURE_USERS.map((user) =>
          user.email === ORGANIZATION_A_PLAYER_EMAIL
            ? { ...user, team_id: "team_a" }
            : user,
        ),
        ...REFERENCE_TABLES,
      },
    });
    const result = await invoke_convex_handler<MutationResult>(
      update_user_role,
      context,
      {
        target_email: ORGANIZATION_A_PLAYER_EMAIL,
        role: "player",
        organization_id: ORGANIZATION_B_ID,
      },
    );
    expect(result.success).toBe(false);
  });

  it("allows clearing a reference with an empty value", async () => {
    const { result, target } = await change_role(ORGANIZATION_A_ADMIN_EMAIL, {
      role: "team_manager",
      team_id: "",
    });
    expect(result.success).toBe(true);
    expect(target?.team_id).toBe("");
  });
});
