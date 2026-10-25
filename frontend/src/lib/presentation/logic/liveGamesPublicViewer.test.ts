import { describe, expect, it } from "vitest";

import { get_allowed_routes_for_role } from "$lib/adapters/iam/roleMenuRegistry";
import { get_tables_for_page } from "$lib/infrastructure/sync/convexPublicDataTables";

import { build_public_viewer_live_games_permissions } from "./liveGamesAccessLogic";

describe("public viewers can watch live games", () => {
  it("lists Live Games in the public viewer's pages", () => {
    expect(
      get_allowed_routes_for_role("public_viewer").has("/live-games"),
    ).toBe(true);
  });

  it("can read live games but never start them", () => {
    expect(build_public_viewer_live_games_permissions()).toMatchObject({
      authorization_succeeded: true,
      is_read_authorized: true,
      can_start_games: false,
    });
  });

  it("pulls the game, lineups and officials from the public data", () => {
    expect(get_tables_for_page("live_games")).toEqual(
      expect.arrayContaining([
        "fixtures",
        "fixture_lineups",
        "fixture_details_setups",
        "officials",
        "players",
      ]),
    );
  });
});
