import { describe, expect, it } from "vitest";

import {
  authenticated_identity,
  create_fake_convex_context,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  build_team_record,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_B_ID,
} from "./lib/security_test_fixtures.test_support";
import { get_record_by_local_id } from "./sync_read_queries";

type LookupResult = {
  status: string;
  reason?: string;
  tombstone_version?: number;
};

async function look_up(local_id: string): Promise<LookupResult> {
  const context = create_fake_convex_context({
    identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
    tables: {
      system_users: ALL_FIXTURE_USERS,
      teams: [build_team_record("team_b", ORGANIZATION_B_ID, 1)],
      sync_tombstones: [
        {
          table_name: "teams",
          local_id: "team_gone",
          version: 6,
          sync_sequence: 3,
          deleted_at: "2024-01-02T00:00:00.000Z",
          scope: { local_id: "team_gone", organization_id: ORGANIZATION_A_ID },
        },
        {
          table_name: "teams",
          local_id: "team_foreign_gone",
          version: 2,
          sync_sequence: 4,
          deleted_at: "2024-01-02T00:00:00.000Z",
          scope: {
            local_id: "team_foreign_gone",
            organization_id: ORGANIZATION_B_ID,
          },
        },
      ],
    },
  });
  return invoke_convex_handler<LookupResult>(get_record_by_local_id, context, {
    table_name: "teams",
    local_id,
  });
}

describe("get_record_by_local_id not_found reasons", () => {
  it("reports records that never existed", async () => {
    expect(await look_up("team_missing")).toMatchObject({
      status: "not_found",
      reason: "never_existed",
    });
  });

  it("reports visible deletions with the tombstone version", async () => {
    expect(await look_up("team_gone")).toMatchObject({
      status: "not_found",
      reason: "deleted",
      tombstone_version: 6,
    });
  });

  it("reports records and deletions the caller may not see as not visible", async () => {
    expect(await look_up("team_b")).toMatchObject({
      status: "not_found",
      reason: "not_visible",
    });
    const foreign_deletion = await look_up("team_foreign_gone");
    expect(foreign_deletion).toMatchObject({ reason: "not_visible" });
    expect(foreign_deletion).not.toHaveProperty("tombstone_version");
  });
});
