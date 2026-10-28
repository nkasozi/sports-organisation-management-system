import { describe, expect, it } from "vitest";

import {
  can_identity_run_fixture,
  decide_live_game_control,
  LIVE_GAME_ACTOR,
} from "./liveGameControl";

const ASSIGNED = [
  { official_id: "off_umpire", role_id: "role_ump", role_name: "Main Umpire" },
  {
    official_id: "off_table",
    role_id: "role_table",
    role_name: "Table Official",
  },
];
const TABLE_ROLE_IDS = new Set(["role_table"]);

function decide(
  role: string,
  official_id = "",
): ReturnType<typeof decide_live_game_control> {
  return decide_live_game_control({
    role,
    official_id,
    assigned_officials: ASSIGNED,
    table_role_ids: TABLE_ROLE_IDS,
  });
}

describe("who can run a live game", () => {
  it("lets admins and officials managers run any game", () => {
    for (const role of ["super_admin", "org_admin", "officials_manager"]) {
      expect(decide(role).actor, role).toBe(LIVE_GAME_ACTOR.MANAGER);
    }
  });

  it("lets the official assigned as this game's table official run it", () => {
    expect(decide("official", "off_table")).toEqual({
      actor: LIVE_GAME_ACTOR.TABLE_OFFICIAL,
      notice: "",
    });
  });

  it("explains to other officials on the game that only the table official runs it", () => {
    expect(decide("official", "off_umpire")).toEqual({
      actor: LIVE_GAME_ACTOR.WATCHER,
      notice:
        "You're assigned to this game as Main Umpire. Only the table official runs the live game, so you're following it like a spectator.",
    });
  });

  it("lets officials who aren't on the game watch it", () => {
    expect(decide("official", "off_elsewhere").actor).toBe(
      LIVE_GAME_ACTOR.WATCHER,
    );
    expect(decide("official").notice).toContain("Only the table official");
  });

  it("keeps team managers and players as watchers", () => {
    expect(decide("team_manager").actor).toBe(LIVE_GAME_ACTOR.WATCHER);
    expect(decide("player").actor).toBe(LIVE_GAME_ACTOR.WATCHER);
  });

  it("shows the start button only on games the person can run", () => {
    const table_official = {
      role: "official",
      official_id: "off_table",
      display_name: "Grace Akello",
      role_label: "Official",
      table_role_ids: TABLE_ROLE_IDS,
    };

    expect(
      can_identity_run_fixture(table_official, {
        assigned_officials: ASSIGNED,
      }),
    ).toBe(true);
    expect(
      can_identity_run_fixture(table_official, { assigned_officials: [] }),
    ).toBe(false);
  });
});
