import { describe, expect, it } from "vitest";

import {
  build_public_player_stats_bundle,
  load_public_player,
  load_public_player_link_sections,
  load_public_player_position,
  load_public_player_profile,
} from "./playerPublicProfileDataLoaderSupport";

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
    ).toEqual({ id: "position-1", name: "Forward" });

    expect(
      await load_public_player_link_sections(
        {
          dependencies: {
            profile_link_use_cases: {
              list_by_profile: async () => ({
                success: true,
                data: {
                  items: [
                    { id: "1", platform: "website", url: "https://club.test" },
                    {
                      id: "2",
                      platform: "youtube",
                      url: "https://youtube.test/watch",
                    },
                    {
                      id: "3",
                      platform: "twitter",
                      url: "https://x.test/jane",
                    },
                  ],
                },
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
      overall_stats: {
        total_matches: 0,
        goals: 0,
        own_goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        substitutions_in: 0,
        substitutions_out: 0,
      },
      team_stats: [],
    });

    expect(
      await build_public_player_stats_bundle(
        {
          dependencies: {
            membership_use_cases: {
              list: async () => ({
                success: true,
                data: {
                  items: [
                    {
                      id: "membership-1",
                      player_id: "player-1",
                      team_id: "team-1",
                    },
                  ],
                },
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
                data: {
                  items: [
                    {
                      id: "fixture-1",
                      status: "completed",
                      home_team_id: "team-1",
                      away_team_id: "team-2",
                      game_events: [
                        {
                          event_type: "goal",
                          player_name: "Jane Doe",
                          secondary_player_name: "Alex Roe",
                        },
                        {
                          event_type: "yellow_card",
                          player_name: "Jane Doe",
                          secondary_player_name: "",
                        },
                      ],
                    },
                  ],
                },
              }),
            },
          },
        } as never,
        { id: "player-1", first_name: "Jane", last_name: "Doe" } as never,
      ),
    ).toEqual({
      overall_stats: {
        total_matches: 1,
        goals: 1,
        own_goals: 0,
        assists: 0,
        yellow_cards: 1,
        red_cards: 0,
        substitutions_in: 0,
        substitutions_out: 0,
      },
      team_stats: [
        {
          membership: {
            id: "membership-1",
            player_id: "player-1",
            team_id: "team-1",
          },
          team: { id: "team-1", name: "City Hawks" },
          stats: {
            total_matches: 1,
            goals: 1,
            own_goals: 0,
            assists: 0,
            yellow_cards: 1,
            red_cards: 0,
            substitutions_in: 0,
            substitutions_out: 0,
          },
        },
      ],
    });
  });
});
