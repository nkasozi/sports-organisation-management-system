import { describe, expect, it } from "vitest";

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
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import { delete_record, force_resolve_conflict } from "./sync_basic_mutations";

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

describe("delete_record", () => {
  it("deletes an owned record", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_a", ORGANIZATION_A_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      delete_record,
      context,
      { table_name: "teams", local_id: "team_a" },
    );
    expect(result).toMatchObject({ success: true, action: "deleted" });
  });

  it("reports not_found for missing records", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      delete_record,
      context,
      { table_name: "teams", local_id: "missing" },
    );
    expect(result).toMatchObject({ success: true, action: "not_found" });
  });

  it("blocks deleting another organization's record", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_b", ORGANIZATION_B_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      delete_record,
      context,
      { table_name: "teams", local_id: "team_b" },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(1);
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ORG_SCOPE_VIOLATION,
    );
  });
});

describe("force_resolve_conflict", () => {
  it("resolves a conflict on an owned record", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_a", ORGANIZATION_A_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      force_resolve_conflict,
      context,
      {
        table_name: "teams",
        local_id: "team_a",
        resolved_data: build_team_record("team_a", ORGANIZATION_A_ID, 3),
        new_version: 3,
        resolution_action: "keep_local",
      },
    );
    expect(result).toMatchObject({
      success: true,
      action: "conflict_resolved",
    });
  });

  it("blocks resolving into another organization's record", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_b", ORGANIZATION_B_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      force_resolve_conflict,
      context,
      {
        table_name: "teams",
        local_id: "team_b",
        resolved_data: build_team_record("team_b", ORGANIZATION_A_ID, 3),
        new_version: 3,
        resolution_action: "keep_local",
      },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")[0].organization_id).toBe(
      ORGANIZATION_B_ID,
    );
  });

  it("rejects unsafe URL protocols in resolved data", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      force_resolve_conflict,
      context,
      {
        table_name: "teams",
        local_id: "team_url",
        resolved_data: {
          ...build_team_record("team_url", ORGANIZATION_A_ID, 1),
          logo_url: "javascript:alert(1)",
        },
        new_version: 1,
        resolution_action: "keep_local",
      },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(0);
  });
});
