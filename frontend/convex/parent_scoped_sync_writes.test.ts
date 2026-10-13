import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  get_scheduled_event_types,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  build_stage,
  PARENT_SCOPED_ROWS,
  PARENT_TABLE_ROWS,
} from "./lib/parent_scoped_fixtures.test_support";
import { SecurityEventType } from "./lib/security_event_types";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import {
  delete_record,
  force_resolve_conflict,
  upsert_record,
} from "./sync_basic_mutations";
import { batch_upsert } from "./sync_batch_mutation";

type MutationResult = { success: boolean; action?: string };
type BatchResult = { results: Array<{ success: boolean; action: string }> };

function create_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      ...PARENT_TABLE_ROWS,
      ...PARENT_SCOPED_ROWS,
    },
  });
}

async function upsert_stage(
  email: string,
  local_id: string,
  competition_id: string,
): Promise<{ context: FakeConvexContext; result: MutationResult }> {
  const context = create_context(email);
  const result = await invoke_convex_handler<MutationResult>(
    upsert_record,
    context,
    {
      table_name: "competition_stages",
      local_id,
      data: build_stage(local_id, competition_id, 5),
      version: 5,
    },
  );
  return { context, result };
}

function find_stage(
  context: ReturnType<typeof create_context>,
  local_id: string,
): Record<string, unknown> {
  return (
    find_table_rows(context, "competition_stages").find(
      (row) => row.local_id === local_id,
    ) ?? {}
  );
}

describe("parent scoped writes", () => {
  it("allows writes under a parent owned by the caller organization", async () => {
    const { result } = await upsert_stage(
      ORGANIZATION_A_ADMIN_EMAIL,
      "stage_new",
      "competition_a",
    );
    expect(result).toMatchObject({ success: true, action: "created" });
  });

  it("blocks writes under another organization's parent and audits them", async () => {
    const { context, result } = await upsert_stage(
      ORGANIZATION_A_ADMIN_EMAIL,
      "stage_new",
      "competition_b",
    );
    expect(result.success).toBe(false);
    expect(find_stage(context, "stage_new")).toEqual({});
    expect(get_scheduled_event_types(context)).toContain(
      SecurityEventType.ORG_SCOPE_VIOLATION,
    );
  });

  it("blocks writes whose parent is missing or unknown", async () => {
    expect(
      (await upsert_stage(ORGANIZATION_A_ADMIN_EMAIL, "stage_new", "")).result
        .success,
    ).toBe(false);
    expect(
      (
        await upsert_stage(
          ORGANIZATION_A_ADMIN_EMAIL,
          "stage_new",
          "competition_gone",
        )
      ).result.success,
    ).toBe(false);
  });

  it("blocks re-parenting another organization's existing record", async () => {
    const { context, result } = await upsert_stage(
      ORGANIZATION_A_ADMIN_EMAIL,
      "stage_b",
      "competition_a",
    );
    expect(result.success).toBe(false);
    expect(find_stage(context, "stage_b")?.competition_id).toBe(
      "competition_b",
    );
  });

  it("lets super admins write under any parent", async () => {
    const { result } = await upsert_stage(
      SUPER_ADMIN_EMAIL,
      "stage_new",
      "competition_b",
    );
    expect(result.success).toBe(true);
  });

  it("blocks deleting and force resolving another organization's record", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const deleted = await invoke_convex_handler<MutationResult>(
      delete_record,
      context,
      {
        table_name: "identifications",
        local_id: "identification_b",
      },
    );
    const resolved = await invoke_convex_handler<MutationResult>(
      force_resolve_conflict,
      context,
      {
        table_name: "profile_links",
        local_id: "link_b",
        resolved_data: {
          profile_id: "player_profile_a",
          platform: "x",
          url: "https://a.example.com",
        },
        new_version: 3,
        resolution_action: "keep_local",
      },
    );
    expect(deleted.success).toBe(false);
    expect(resolved.success).toBe(false);
    expect(find_table_rows(context, "identifications")).toHaveLength(2);
  });

  it("checks each batch record's parent organization", async () => {
    const context = create_context(ORGANIZATION_A_ADMIN_EMAIL);
    const result = await invoke_convex_handler<BatchResult>(
      batch_upsert,
      context,
      {
        table_name: "identifications",
        records: [
          {
            local_id: "identification_new_a",
            data: { holder_type: "player", holder_id: "player_a" },
            version: 1,
          },
          {
            local_id: "identification_new_b",
            data: { holder_type: "player", holder_id: "player_b" },
            version: 1,
          },
        ],
      },
    );
    expect(result.results.map((entry) => entry.action)).toEqual([
      "created",
      "rejected_wrong_organization",
    ]);
  });
});
