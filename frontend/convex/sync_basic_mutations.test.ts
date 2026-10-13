import { describe, expect, it } from "vitest";

import {
  ANONYMOUS_IDENTITY,
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
  GLOBAL_SCOPE_ID,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
  SUPER_ADMIN_EMAIL,
  UNSCOPED_USER_EMAIL,
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

describe("upsert_record characterization", () => {
  it("creates a record in the caller's organization", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_new",
        data: build_team_record("team_new", ORGANIZATION_A_ID, 1),
        version: 1,
      },
    );
    expect(result).toMatchObject({ success: true, action: "created" });
    expect(find_table_rows(context, "teams")).toHaveLength(1);
  });

  it("updates an owned record when the client edited the current version", async () => {
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
          name: "Renamed",
        },
        version: 1,
      },
    );
    expect(result).toMatchObject({
      success: true,
      action: "updated",
      server_version: 2,
    });
  });

  it("rejects anonymous callers", async () => {
    const context = create_fake_convex_context({
      identity: ANONYMOUS_IDENTITY,
      tables: { system_users: ALL_FIXTURE_USERS },
    });
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      { table_name: "teams", local_id: "x", data: {}, version: 1 },
    );
    expect(result.success).toBe(false);
  });

  it("rejects tables outside the sync allowlist", async () => {
    const context = create_context_for(SUPER_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      { table_name: "role_permissions", local_id: "x", data: {}, version: 1 },
    );
    expect(result.success).toBe(false);
  });
});

describe("upsert_record tenant isolation", () => {
  it("blocks overwriting another organization's record by local_id", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, [
      build_team_record("team_b", ORGANIZATION_B_ID, 1),
    ]);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_b",
        data: build_team_record("team_b", ORGANIZATION_A_ID, 5),
        version: 5,
      },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")[0].organization_id).toBe(
      ORGANIZATION_B_ID,
    );
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ORG_SCOPE_VIOLATION,
    );
  });

  it("blocks a non-global caller from writing a global organization id", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_star",
        data: build_team_record("team_star", GLOBAL_SCOPE_ID, 1),
        version: 1,
      },
    );
    expect(result.success).toBe(false);
    expect(find_table_rows(context, "teams")).toHaveLength(0);
  });

  it("stamps the caller organization on records that omit it", async () => {
    const context = create_context_for(ORGANIZATION_A_ADMIN_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_blank",
        data: { name: "Blank", organization_id: "" },
        version: 1,
      },
    );
    expect(result.success).toBe(true);
    expect(find_table_rows(context, "teams")[0].organization_id).toBe(
      ORGANIZATION_A_ID,
    );
  });

  it("blocks callers without any organization scope", async () => {
    const context = create_context_for(UNSCOPED_USER_EMAIL, []);
    const result = await invoke_convex_handler<MutationResult>(
      upsert_record,
      context,
      {
        table_name: "teams",
        local_id: "team_none",
        data: { name: "None" },
        version: 1,
      },
    );
    expect(result.success).toBe(false);
  });
});
