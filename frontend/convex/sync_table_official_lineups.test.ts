import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  type FakeConvexContext,
  find_table_rows,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  build_team_record,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

const TABLE_OFFICIAL_EMAIL = "grace.table@example.com";
const FIELD_OFFICIAL_EMAIL = "peter.field@example.com";

function official_user(
  local_id: string,
  email: string,
  official_id: string,
): Record<string, unknown> {
  return {
    local_id,
    email,
    role: "official",
    organization_id: ORGANIZATION_A_ID,
    official_id,
    status: "active",
    synced_at: "2024-01-01T00:00:00.000Z",
    version: 1,
  };
}

function create_game_context(email: string): FakeConvexContext {
  return create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: [
        official_user("user_grace", TABLE_OFFICIAL_EMAIL, "official_grace"),
        official_user("user_peter", FIELD_OFFICIAL_EMAIL, "official_peter"),
      ],
      game_official_roles: [
        {
          local_id: "role_table",
          organization_id: ORGANIZATION_A_ID,
          name: "Table Official",
          is_table_official: true,
          version: 1,
        },
        {
          local_id: "role_umpire",
          organization_id: ORGANIZATION_A_ID,
          name: "Main Umpire",
          is_table_official: false,
          version: 1,
        },
      ],
      fixtures: [
        {
          local_id: "fixture_today",
          organization_id: ORGANIZATION_A_ID,
          assigned_officials: [
            { official_id: "official_grace", role_id: "role_table" },
            { official_id: "official_peter", role_id: "role_umpire" },
          ],
          version: 1,
        },
        {
          local_id: "fixture_other",
          organization_id: ORGANIZATION_A_ID,
          assigned_officials: [],
          version: 1,
        },
      ],
      teams: [build_team_record("team_home", ORGANIZATION_A_ID, 1)],
    },
  });
}

async function save_generated_lineup(
  email: string,
  fixture_id: string,
): Promise<{ saved: boolean; stored: number }> {
  const context = create_game_context(email);
  const result = await invoke_convex_handler<{
    results: Array<{ success: boolean }>;
  }>(batch_upsert, context, {
    table_name: "fixture_lineups",
    records: [
      {
        local_id: `lineup_${fixture_id}`,
        data: {
          organization_id: ORGANIZATION_A_ID,
          fixture_id,
          team_id: "team_home",
          selected_players: [],
        },
        base_version: { kind: "unknown" },
        version: 1,
      },
    ],
  });
  return {
    saved: result.results[0]?.success ?? false,
    stored: find_table_rows(context, "fixture_lineups").length,
  };
}

describe("squads generated when a table official starts a game", () => {
  it("are saved when the official is that game's table official", async () => {
    expect(
      await save_generated_lineup(TABLE_OFFICIAL_EMAIL, "fixture_today"),
    ).toEqual({ saved: true, stored: 1 });
  });

  it("are refused for an official who isn't running the game", async () => {
    expect(
      await save_generated_lineup(FIELD_OFFICIAL_EMAIL, "fixture_today"),
    ).toEqual({ saved: false, stored: 0 });
  });

  it("are refused for a game the official isn't assigned to", async () => {
    expect(
      await save_generated_lineup(TABLE_OFFICIAL_EMAIL, "fixture_other"),
    ).toEqual({ saved: false, stored: 0 });
  });
});
