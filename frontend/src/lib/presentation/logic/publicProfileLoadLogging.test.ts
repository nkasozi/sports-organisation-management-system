import { afterEach, describe, expect, it, vi } from "vitest";

import { PLAYER_PUBLIC_PROFILE_EVENT } from "./playerPublicProfileDataLoaderContracts";
import {
  load_public_player,
  load_public_player_position,
} from "./playerPublicProfileDataLoaderSupport";
import { PRESENCE_STATUS } from "./presenceStatus";
import { TEAM_PUBLIC_PROFILE_EVENT } from "./teamPublicProfileDataLoaderContracts";
import {
  load_public_team,
  load_public_team_profile_links,
} from "./teamPublicProfileDataLoaderSupport";

describe("public profile load logging", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs the team id when a public team cannot be loaded", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await load_public_team(
      {
        dependencies: {
          team_use_cases: { get_by_id: async () => ({ success: false }) },
        },
      } as never,
      { id: "profile-1", team_id: "team-1" } as never,
    );
    expect(result.success).toBe(false);
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: TEAM_PUBLIC_PROFILE_EVENT.TEAM_UNAVAILABLE,
        team_id: "team-1",
      }),
    );
  });

  it("logs when team profile links cannot be loaded and returns none", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const links = await load_public_team_profile_links(
      {
        dependencies: {
          profile_link_use_cases: {
            list_by_profile: async () => ({ success: false }),
          },
        },
      } as never,
      { id: "profile-1" } as never,
    );
    expect(links).toEqual([]);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: TEAM_PUBLIC_PROFILE_EVENT.LINKS_UNAVAILABLE,
      }),
    );
  });

  it("logs the player id when a public player cannot be loaded", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await load_public_player(
      {
        dependencies: {
          player_use_cases: { get_by_id: async () => ({ success: false }) },
        },
      } as never,
      { id: "profile-1", player_id: "player-1" } as never,
    );
    expect(result.success).toBe(false);
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: PLAYER_PUBLIC_PROFILE_EVENT.PLAYER_UNAVAILABLE,
        player_id: "player-1",
      }),
    );
  });

  it("logs and returns a missing position when the lookup fails", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const position_state = await load_public_player_position(
      {
        dependencies: {
          position_use_cases: { get_by_id: async () => ({ success: false }) },
        },
      } as never,
      { id: "player-1", position_id: "position-1" } as never,
    );
    expect(position_state).toEqual({ status: PRESENCE_STATUS.MISSING });
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: PLAYER_PUBLIC_PROFILE_EVENT.POSITION_UNAVAILABLE,
      }),
    );
  });
});
