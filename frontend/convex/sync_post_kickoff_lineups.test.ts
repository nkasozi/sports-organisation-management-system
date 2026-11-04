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
  ORGANIZATION_B_ADMIN_EMAIL,
  SUPER_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

const LINEUP = {
  organization_id: ORGANIZATION_A_ID,
  fixture_id: "semifinal",
  team_id: "khc",
  status: "locked",
  selected_players: [
    { id: "player-1", first_name: "Test", last_name: "Player" },
  ],
};

async function save_correction(
  email: string,
  version: number,
): Promise<{ saved: boolean | undefined; notes: unknown }> {
  const context = create_fake_convex_context({
    identity: authenticated_identity(email),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      fixtures: [
        {
          local_id: "semifinal",
          organization_id: ORGANIZATION_A_ID,
          home_team_id: "khc",
          away_team_id: "rockets",
          status: "completed",
        },
      ],
      teams: [build_team_record("khc", ORGANIZATION_A_ID, 1)],
      fixture_lineups: version
        ? [{ ...LINEUP, local_id: "lineup", version }]
        : [],
    },
  });
  const response = await invoke_convex_handler<{
    results: Array<{ success: boolean }>;
  }>(batch_upsert, context, {
    table_name: "fixture_lineups",
    records: [
      {
        local_id: "lineup",
        data: { ...LINEUP, notes: "Verified squad correction" },
        base_version: version
          ? { kind: "known", version }
          : { kind: "unknown" },
        version: version + 1,
      },
    ],
  });
  return {
    saved: response.results[0]?.success,
    notes: find_table_rows(context, "fixture_lineups")[0]?.notes,
  };
}

describe("completed fixture lineup corrections", () => {
  it.each([SUPER_ADMIN_EMAIL, ORGANIZATION_A_ADMIN_EMAIL])(
    "lets %s submit a missing lineup and correct a locked lineup",
    async (email) => {
      for (const version of [0, 1]) {
        expect(await save_correction(email, version)).toEqual({
          saved: true,
          notes: "Verified squad correction",
        });
      }
    },
  );

  it.each([ORGANIZATION_B_ADMIN_EMAIL, "manager.a@example.com"])(
    "rejects %s for both new and existing lineups",
    async (email) => {
      for (const version of [0, 1]) {
        expect(await save_correction(email, version)).toEqual({
          saved: false,
          notes: undefined,
        });
      }
    },
  );
});
