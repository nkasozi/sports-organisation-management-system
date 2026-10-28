import { describe, expect, it } from "vitest";

import { search_audit_logs } from "./audit_logs";
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
import { batch_delete } from "./sync_batch_delete_mutation";
import { batch_upsert } from "./sync_batch_mutation";

const GOAL = {
  id: "evt_1",
  event_type: "goal",
  minute: 14,
  team_side: "home",
  player_name: "Robert Kizza",
  secondary_player_name: "",
};

function create_context(): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [
        {
          ...build_team_record("team_lions", ORGANIZATION_A_ID, 1),
          name: "Lions",
        },
        {
          ...build_team_record("team_tigers", ORGANIZATION_A_ID, 1),
          name: "Tigers",
        },
      ],
      fixtures: [
        {
          local_id: "fixture_final",
          organization_id: ORGANIZATION_A_ID,
          home_team_id: "team_lions",
          away_team_id: "team_tigers",
          game_events: [],
          synced_at: "2024-01-01T00:00:00.000Z",
          version: 1,
        },
      ],
    },
  });
}

async function save(
  context: FakeConvexContext,
  table_name: string,
  local_id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await invoke_convex_handler(batch_upsert, context, {
    table_name,
    records: [
      {
        local_id,
        data,
        version: 2,
        base_version: { kind: "known", version: 1 },
      },
    ],
  });
}

function audit_entries(context: FakeConvexContext): Record<string, unknown>[] {
  return find_table_rows(context, "audit_logs");
}

describe("the server keeps the audit trail for every change it accepts", () => {
  it("records who renamed a team, from what to what", async () => {
    const context = create_context();
    await save(context, "teams", "team_lions", {
      ...build_team_record("team_lions", ORGANIZATION_A_ID, 1),
      name: "Kampala Lions",
    });
    expect(audit_entries(context)).toEqual([
      expect.objectContaining({
        action: "update",
        entity_type: "team",
        entity_id: "team_lions",
        entity_display_name: "Kampala Lions",
        organization_id: ORGANIZATION_A_ID,
        user_id: "user_admin_a",
        user_email: ORGANIZATION_A_ADMIN_EMAIL,
        changes: [
          {
            field_name: "Name",
            old_value: "Lions",
            new_value: "Kampala Lions",
          },
        ],
      }),
    ]);
  });

  it("describes a goal added to a game, naming the game by its teams", async () => {
    const context = create_context();
    await save(context, "fixtures", "fixture_final", {
      organization_id: ORGANIZATION_A_ID,
      home_team_id: "team_lions",
      away_team_id: "team_tigers",
      game_events: [GOAL],
    });
    expect(audit_entries(context)[0]).toMatchObject({
      entity_display_name: "Lions vs Tigers",
      changes: [
        {
          field_name: "Game events: added",
          old_value: "",
          new_value: "Goal 14' Robert Kizza (home)",
        },
      ],
    });
  });

  it("writes nothing when a save changes nothing that matters", async () => {
    const context = create_context();
    await save(context, "teams", "team_lions", {
      ...build_team_record("team_lions", ORGANIZATION_A_ID, 1),
      name: "Lions",
      synced_at: "2026-10-29T00:00:00.000Z",
    });
    expect(audit_entries(context)).toEqual([]);
  });

  it("records a deletion with the values that were removed", async () => {
    const context = create_context();
    await invoke_convex_handler(batch_delete, context, {
      table_name: "teams",
      records: [
        {
          local_id: "team_tigers",
          base_version: { kind: "known", version: 1 },
        },
      ],
    });
    expect(audit_entries(context)).toEqual([
      expect.objectContaining({
        action: "delete",
        entity_display_name: "Tigers",
        changes: expect.arrayContaining([
          { field_name: "Name", old_value: "Tigers", new_value: "" },
        ]),
      }),
    ]);
  });
});

describe("org admins read the server audit trail", () => {
  it("returns the entries the server wrote for their organization", async () => {
    const context = create_context();
    await save(context, "teams", "team_lions", {
      ...build_team_record("team_lions", ORGANIZATION_A_ID, 1),
      name: "Kampala Lions",
    });
    const page = await invoke_convex_handler<{
      success: boolean;
      data: unknown[];
      error?: string;
    }>(search_audit_logs, context, { page_number: 1, page_size: 50 });
    expect(page).toMatchObject({ success: true });
    expect(page.data).toHaveLength(1);
  });
});
