import { describe, expect, it } from "vitest";

import {
  build_public_player_stats_bundle,
  load_public_player,
  load_public_player_link_sections,
  load_public_player_position,
  load_public_player_profile,
} from "./playerPublicProfileDataLoaderSupport";
import {
  build_public_player_membership,
  EMPTY_PUBLIC_PLAYER_STATS,
  PUBLIC_PLAYER_COMPLETED_FIXTURE,
  PUBLIC_PLAYER_LINK_ITEMS,
  SINGLE_FIXTURE_PUBLIC_PLAYER_STATS,
} from "./playerPublicProfileDataLoaderSupport.test_support";

describe("playerPublicProfileDataLoaderSupport", () => {
  it("returns not found and restricted errors for missing or private profiles", async () => {
    expect(
      await load_public_player_profile({
        slug: "missing",
        dependencies: {
          profile_use_cases: {
            get_by_slug: async () => ({ success: false }),
          },
        },
      } as never),
    ).toEqual({
      success: false,
      error: { kind: "not_found", message: "Player profile not found" },
    });

    expect(
      await load_public_player_profile({
        slug: "private",
        dependencies: {
          profile_use_cases: {
            get_by_slug: async () => ({
              success: true,
              data: { visibility: "private" },
            }),
          },
        },
      } as never),
    ).toEqual({
      success: false,
      error: { kind: "restricted", message: "This profile is private" },
    });
  });

  it("loads the player, position, and split profile links when dependencies succeed", async () => {
    const player = {
      id: "player-1",
      first_name: "Jane",
      last_name: "Doe",
      position_id: "position-1",
    };

    expect(
      await load_public_player(
        {
          dependencies: {
            player_use_cases: {
              get_by_id: async () => ({ success: true, data: player }),
            },
          },
        } as never,
        { player_id: "player-1" } as never,
      ),
    ).toEqual({ success: true, data: player });

    expect(
      await load_public_player_position(
        {
          dependencies: {
            position_use_cases: {
              get_by_id: async () => ({
                success: true,
                data: { id: "position-1", name: "Forward" },
              }),
            },
          },
        } as never,
        player as never,
      ),
    ).toEqual({
      status: "present",
      position: { id: "position-1", name: "Forward" },
    });

    expect(
      await load_public_player_position(
        {
          dependencies: {
            position_use_cases: {
              get_by_id: async () => ({
                success: true,
                data: { id: "position-1", name: "Forward" },
              }),
            },
          },
        } as never,
        { ...player, position_id: "" } as never,
      ),
    ).toEqual({ status: "missing" });

    expect(
      await load_public_player_link_sections(
        {
          dependencies: {
            profile_link_use_cases: {
              list_by_profile: async () => ({
                success: true,
                data: { items: PUBLIC_PLAYER_LINK_ITEMS },
              }),
            },
          },
        } as never,
        { id: "profile-1" } as never,
      ),
    ).toEqual({
      social_media_links: [
        { id: "3", platform: "twitter", url: "https://x.test/jane" },
      ],
      website_links: [
        { id: "1", platform: "website", url: "https://club.test" },
      ],
      video_links: [
        {
          id: "2",
          platform: "youtube",
          url: "https://youtube.test/watch",
        },
      ],
    });
  });

  it("builds player team stats and falls back to an empty bundle on list failures", async () => {
    expect(
      await build_public_player_stats_bundle(
        {
          dependencies: {
            membership_use_cases: { list: async () => ({ success: false }) },
            team_use_cases: {
              list: async () => ({ success: true, data: { items: [] } }),
            },
            fixture_use_cases: {
              list: async () => ({ success: true, data: { items: [] } }),
            },
          },
        } as never,
        { id: "player-1", first_name: "Jane", last_name: "Doe" } as never,
      ),
    ).toEqual({
      overall_stats: EMPTY_PUBLIC_PLAYER_STATS,
      team_stats: [],
    });

    expect(
      await build_public_player_stats_bundle(
        {
          dependencies: {
            membership_use_cases: {
              list: async () => ({
                success: true,
                data: { items: [build_public_player_membership()] },
              }),
            },
            team_use_cases: {
              list: async () => ({
                success: true,
                data: { items: [{ id: "team-1", name: "City Hawks" }] },
              }),
            },
            fixture_use_cases: {
              list: async () => ({
                success: true,
                data: { items: [PUBLIC_PLAYER_COMPLETED_FIXTURE] },
              }),
            },
          },
        } as never,
        { id: "player-1", first_name: "Jane", last_name: "Doe" } as never,
      ),
    ).toEqual({
      overall_stats: SINGLE_FIXTURE_PUBLIC_PLAYER_STATS,
      team_stats: [
        {
          membership: build_public_player_membership(),
          team: { id: "team-1", name: "City Hawks" },
          stats: SINGLE_FIXTURE_PUBLIC_PLAYER_STATS,
        },
      ],
    });
  });
});
