import { describe, expect, it, vi } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  load_live_games_fixture_state,
  load_live_games_organizations,
} from "./liveGamesDataLoader";
import type { LiveGamesProfileState } from "./liveGamesDataTypes";
import { LIVE_GAMES_USER_MESSAGE } from "./liveGamesMessages";

function create_profile_state(): LiveGamesProfileState {
  return {
    status: "present",
    profile: { organization_id: "org_1", team_id: ANY_VALUE },
  } as unknown as LiveGamesProfileState;
}

describe("liveGamesDataLoader failures", () => {
  it("returns a friendly failure when organizations cannot be listed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await load_live_games_organizations(
      {
        organization_use_cases: {
          list: async () => ({ success: false }),
        },
      } as never,
      create_profile_state(),
    );

    expect(result).toEqual({
      success: false,
      error: LIVE_GAMES_USER_MESSAGE.ORGANIZATIONS_LOAD_FAILED,
    });
  });

  it("returns a friendly failure when fixtures cannot be listed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await load_live_games_fixture_state(
      {
        fixture_use_cases: { list: async () => ({ success: false }) },
      } as never,
      create_profile_state(),
      "org_1",
    );

    expect(result).toEqual({
      success: false,
      error: LIVE_GAMES_USER_MESSAGE.FIXTURES_LOAD_FAILED,
    });
    expect(console.error).toHaveBeenCalledWith(
      "[LiveGames] Failed to load fixtures",
      { event: "live_games_fixtures_load_failed", organization_id: "org_1" },
    );
  });
});
