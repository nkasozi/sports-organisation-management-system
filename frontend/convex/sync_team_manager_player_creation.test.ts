import { describe, expect, it } from "vitest";

import {
  type FakeConvexContext,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  type BatchResult,
  create_scoped_write_context,
  find_rows,
  MANAGER_EMAIL,
} from "./lib/scoped_write_fixtures.test_support";
import { ORGANIZATION_A_ID } from "./lib/security_test_fixtures.test_support";
import { batch_upsert } from "./sync_batch_mutation";

const NEW_PLAYER_ID = "player_new";
const BATCH_REJECTED_ACTION = "batch_rejected";
const NEW_PLAYER_DATA = {
  first_name: "New",
  last_name: "Recruit",
  organization_id: ORGANIZATION_A_ID,
};

async function push(
  context: FakeConvexContext,
  table_name: string,
  record: {
    local_id: string;
    data: Record<string, unknown>;
    base_version: unknown;
  },
): Promise<BatchResult["results"][number]> {
  const result = await invoke_convex_handler<BatchResult>(
    batch_upsert,
    context,
    { table_name, records: [{ ...record, version: 1 }] },
  );
  return (
    result.results[0] ?? {
      local_id: record.local_id,
      success: false,
      action: BATCH_REJECTED_ACTION,
    }
  );
}

function build_membership(
  local_id: string,
  player_id: string,
  team_id: string,
): { local_id: string; data: Record<string, unknown>; base_version: unknown } {
  return {
    local_id,
    data: {
      player_id,
      team_id,
      organization_id: ORGANIZATION_A_ID,
      status: "active",
    },
    base_version: { kind: "unknown" },
  };
}

async function create_new_player(context: FakeConvexContext): Promise<string> {
  const outcome = await push(context, "players", {
    local_id: NEW_PLAYER_ID,
    data: NEW_PLAYER_DATA,
    base_version: { kind: "unknown" },
  });
  return outcome.action;
}

describe("team manager player creation", () => {
  it("stamps the creating user on a new player and ignores a client supplied creator", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    await push(context, "players", {
      local_id: NEW_PLAYER_ID,
      data: { ...NEW_PLAYER_DATA, created_by_user_id: "someone_else" },
      base_version: { kind: "unknown" },
    });
    expect(
      find_rows(context, "players", NEW_PLAYER_ID)[0].created_by_user_id,
    ).toBe("user_manager_a");
  });

  it("accepts an identical retry of a create whose acknowledgement was lost", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    expect(await create_new_player(context)).toBe("created");
    const retry = await push(context, "players", {
      local_id: NEW_PLAYER_ID,
      data: NEW_PLAYER_DATA,
      base_version: { kind: "unknown" },
    });
    expect(retry.success).toBe(true);
    expect(retry.action).toBe("skipped");
  });

  it("lets the manager add the created player to their own team and then manage the player", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    await create_new_player(context);
    const membership = await push(
      context,
      "player_team_memberships",
      build_membership("m_new", NEW_PLAYER_ID, "team_a"),
    );
    expect(membership.success).toBe(true);
    const update = await push(context, "players", {
      local_id: NEW_PLAYER_ID,
      data: { ...NEW_PLAYER_DATA, first_name: "Renamed" },
      base_version: { kind: "known", version: 1 },
    });
    expect(update.success).toBe(true);
  });

  it("lets the manager edit a player they created before the membership is pushed", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    await create_new_player(context);
    const update = await push(context, "players", {
      local_id: NEW_PLAYER_ID,
      data: { ...NEW_PLAYER_DATA, first_name: "Early" },
      base_version: { kind: "known", version: 1 },
    });
    expect(update.success).toBe(true);
  });

  it("rejects adding a player the manager did not create and does not manage", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    const membership = await push(
      context,
      "player_team_memberships",
      build_membership("m_steal", "player_a2", "team_a"),
    );
    expect(membership.success).toBe(false);
  });

  it("rejects adding the created player to a team the manager does not manage", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    await create_new_player(context);
    const membership = await push(
      context,
      "player_team_memberships",
      build_membership("m_other", NEW_PLAYER_ID, "team_a2"),
    );
    expect(membership.success).toBe(false);
  });

  it("does not let a manager change an existing membership", async () => {
    const context = create_scoped_write_context(MANAGER_EMAIL);
    const update = await push(context, "player_team_memberships", {
      local_id: "m1",
      data: { status: "ended" },
      base_version: { kind: "known", version: 0 },
    });
    expect(update.success).toBe(false);
  });
});
