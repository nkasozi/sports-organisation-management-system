import { describe, expect, it } from "vitest";

import {
  create_context,
  find_record,
  read_changes,
  tombstone_ids,
  upsert_as_admin,
} from "./lib/ownership_scope_fixtures.test_support";
import { MANAGER_EMAIL } from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
} from "./lib/security_test_fixtures.test_support";

describe("ownership changes re-send affected records", () => {
  it("re-sends the full player and their identification when a player joins the manager's team", async () => {
    const context = create_context();
    expect(
      await upsert_as_admin(context, "player_team_memberships", {
        local_id: "m2",
        data: {
          organization_id: ORGANIZATION_A_ID,
          team_id: "team_a",
          player_id: "player_a2",
          status: "active",
        },
        base_version: { kind: "unknown" },
      }),
    ).toBe("created");
    const players = await read_changes(context, MANAGER_EMAIL, "players");
    expect(find_record(players, "player_a2").medical_notes).toBe("asthma");
    const identifications = await read_changes(
      context,
      MANAGER_EMAIL,
      "identifications",
    );
    expect(find_record(identifications, "id_a2").local_id).toBe("id_a2");
    expect(tombstone_ids(identifications)).not.toContain("id_a2");
  });

  it("re-sends the projected player and a tombstone for their identification when a player leaves", async () => {
    const context = create_context();
    await upsert_as_admin(context, "player_team_memberships", {
      local_id: "m1",
      data: { status: "ended" },
      base_version: { kind: "known", version: 1 },
    });
    const players = await read_changes(context, MANAGER_EMAIL, "players");
    expect(find_record(players, "player_a").first_name).toBe("Pat");
    expect(find_record(players, "player_a")).not.toHaveProperty(
      "medical_notes",
    );
    const identifications = await read_changes(
      context,
      MANAGER_EMAIL,
      "identifications",
    );
    expect(tombstone_ids(identifications)).toContain("id_a");
    expect(find_record(identifications, "id_a")).toEqual({});
  });

  it("does not send a removal to readers who can still see the record", async () => {
    const context = create_context();
    await upsert_as_admin(context, "player_team_memberships", {
      local_id: "m1",
      data: { status: "ended" },
      base_version: { kind: "known", version: 1 },
    });
    const identifications = await read_changes(
      context,
      ORGANIZATION_A_ADMIN_EMAIL,
      "identifications",
    );
    expect(tombstone_ids(identifications)).not.toContain("id_a");
    expect(find_record(identifications, "id_a").local_id).toBe("id_a");
  });

  it("re-evaluates access when a manager is moved to another team", async () => {
    const context = create_context();
    await upsert_as_admin(context, "system_users", {
      local_id: "user_manager_a",
      data: { email: MANAGER_EMAIL, team_id: "team_a2" },
      base_version: { kind: "known", version: 1 },
    });
    const identifications = await read_changes(
      context,
      MANAGER_EMAIL,
      "identifications",
    );
    expect(tombstone_ids(identifications)).toContain("id_a");
  });

  it("lets a reader who regains access receive a newer version than the removal", async () => {
    const context = create_context();
    await upsert_as_admin(context, "player_team_memberships", {
      local_id: "m1",
      data: { status: "ended" },
      base_version: { kind: "known", version: 1 },
    });
    const removal = await read_changes(
      context,
      MANAGER_EMAIL,
      "identifications",
    );
    const removed_version = removal.tombstones[0].version;
    await upsert_as_admin(context, "player_team_memberships", {
      local_id: "m1",
      data: { status: "active" },
      base_version: { kind: "known", version: 2 },
    });
    const regained = await read_changes(
      context,
      MANAGER_EMAIL,
      "identifications",
    );
    expect(Number(find_record(regained, "id_a").version)).toBeGreaterThan(
      removed_version,
    );
  });
});
