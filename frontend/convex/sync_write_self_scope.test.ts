import { describe, expect, it } from "vitest";

import {
  find_rows,
  KNOWN_V1,
  MANAGER_EMAIL,
  UNKNOWN,
  upsert_one,
} from "./lib/scoped_write_fixtures.test_support";
import {
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_ID,
  ORGANIZATION_A_PLAYER_EMAIL,
} from "./lib/security_test_fixtures.test_support";

describe("self-scoped writes", () => {
  it("lets a player update only their own player record", async () => {
    const own = await upsert_one(ORGANIZATION_A_PLAYER_EMAIL, "players", {
      local_id: "player_a",
      data: { organization_id: ORGANIZATION_A_ID, nationality: "KE" },
      base_version: KNOWN_V1,
    });
    expect(own.outcome.success).toBe(true);
    const other = await upsert_one(ORGANIZATION_A_PLAYER_EMAIL, "players", {
      local_id: "player_a2",
      data: { organization_id: ORGANIZATION_A_ID, nationality: "KE" },
      base_version: KNOWN_V1,
    });
    expect(other.outcome.success).toBe(false);
    expect(
      find_rows(other.context, "players", "player_a2")[0].nationality,
    ).toBe("UG");
  });

  it("blocks players from editing other identifications or verifying their own", async () => {
    const other = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      "identifications",
      {
        local_id: "id_a2",
        data: { holder_type: "player", holder_id: "player_a2", notes: "x" },
        base_version: KNOWN_V1,
      },
    );
    expect(other.outcome.success).toBe(false);
    const verify = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      "identifications",
      {
        local_id: "id_a",
        data: {
          holder_type: "player",
          holder_id: "player_a",
          is_verified: true,
        },
        base_version: KNOWN_V1,
      },
    );
    expect(verify.outcome.success).toBe(false);
    expect(
      find_rows(verify.context, "identifications", "id_a")[0].is_verified,
    ).toBe(false);
    const edit = await upsert_one(
      ORGANIZATION_A_PLAYER_EMAIL,
      "identifications",
      {
        local_id: "id_a",
        data: {
          holder_type: "player",
          holder_id: "player_a",
          notes: "renewed",
        },
        base_version: KNOWN_V1,
      },
    );
    expect(edit.outcome.success).toBe(true);
  });

  it("limits team managers to their own team and its players", async () => {
    const own_team = await upsert_one(MANAGER_EMAIL, "teams", {
      local_id: "team_a",
      data: { organization_id: ORGANIZATION_A_ID, name: "Renamed" },
      base_version: KNOWN_V1,
    });
    expect(own_team.outcome.success).toBe(true);
    const other_team = await upsert_one(MANAGER_EMAIL, "teams", {
      local_id: "team_a2",
      data: { organization_id: ORGANIZATION_A_ID, name: "Hijacked" },
      base_version: KNOWN_V1,
    });
    expect(other_team.outcome.success).toBe(false);
    const other_player = await upsert_one(MANAGER_EMAIL, "players", {
      local_id: "player_a2",
      data: { organization_id: ORGANIZATION_A_ID, nationality: "KE" },
      base_version: KNOWN_V1,
    });
    expect(other_player.outcome.success).toBe(false);
    const new_player = await upsert_one(MANAGER_EMAIL, "players", {
      local_id: "player_new",
      data: { organization_id: ORGANIZATION_A_ID, first_name: "New" },
      base_version: UNKNOWN,
    });
    expect(new_player.outcome.success).toBe(true);
  });

  it("lets org admins verify identifications", async () => {
    const { outcome } = await upsert_one(
      ORGANIZATION_A_ADMIN_EMAIL,
      "identifications",
      {
        local_id: "id_a2",
        data: {
          holder_type: "player",
          holder_id: "player_a2",
          is_verified: true,
        },
        base_version: KNOWN_V1,
      },
    );
    expect(outcome.success).toBe(true);
  });
});
