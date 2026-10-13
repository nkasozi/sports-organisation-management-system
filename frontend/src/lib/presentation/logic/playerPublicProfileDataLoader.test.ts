import { describe, expect, it } from "vitest";

import { load_player_public_profile_page_data } from "./playerPublicProfileDataLoader";
import {
  create_fixture,
  create_game_event,
  create_membership,
  create_player,
  create_player_profile,
  create_position,
  create_profile_link,
  create_team,
} from "./playerPublicProfileDataLoader.test_support";

describe("playerPublicProfileDataLoader", () => {
  it("returns a restricted failure for private profiles", async () => {
    const result = await load_player_public_profile_page_data({
      slug: "private-profile",
      dependencies: {
        profile_use_cases: {
          get_by_slug: async () => ({
            success: true,
            data: create_player_profile({ visibility: "private" }),
          }),
        },
        player_use_cases: { get_by_id: async () => ({ success: false }) },
        team_use_cases: {
          list: async () => ({ success: true, data: { items: [] } }),
        },
        membership_use_cases: {
          list: async () => ({ success: true, data: { items: [] } }),
        },
        fixture_use_cases: {
          list: async () => ({ success: true, data: { items: [] } }),
        },
        position_use_cases: { get_by_id: async () => ({ success: false }) },
        profile_link_use_cases: {
          list_by_profile: async () => ({ success: true, data: { items: [] } }),
        },
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.kind).toBe("restricted");
  });

  it("loads player stats and splits links by section", async () => {
    const dependencies = {
      profile_use_cases: {
        get_by_slug: async () => ({
          success: true,
          data: create_player_profile(),
        }),
      },
      player_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: create_player(),
        }),
      },
      team_use_cases: {
        list: async () => ({
          success: true,
          data: { items: [create_team()] },
        }),
      },
      membership_use_cases: {
        list: async () => ({
          success: true,
          data: { items: [create_membership()] },
        }),
      },
      fixture_use_cases: {
        list: async () => ({
          success: true,
          data: {
            items: [
              create_fixture({
                game_events: [
                  create_game_event(),
                  create_game_event({
                    id: "event_2",
                    event_type: "yellow_card",
                  }),
                  create_game_event({
                    id: "event_3",
                    event_type: "substitution",
                    secondary_player_name: "Jane Doe",
                    player_name: "Sub Player",
                  }),
                ],
              }),
            ],
          },
        }),
      },
      position_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: create_position(),
        }),
      },
      profile_link_use_cases: {
        list_by_profile: async () => ({
          success: true,
          data: {
            items: [
              create_profile_link(),
              create_profile_link({
                id: "link_2",
                platform: "website",
                title: "Website",
              }),
              create_profile_link({
                id: "link_3",
                platform: "youtube",
                title: "Highlights",
              }),
            ],
          },
        }),
      },
    };

    const result = await load_player_public_profile_page_data({
      slug: "jane-doe",
      dependencies: dependencies as never,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.position_state).toEqual({
      status: "present",
      position: expect.objectContaining({ name: "Winger" }),
    });
    expect(result.data.overall_stats.total_matches).toBe(1);
    expect(result.data.overall_stats.goals).toBe(1);
    expect(result.data.overall_stats.yellow_cards).toBe(1);
    expect(result.data.overall_stats.substitutions_out).toBe(1);
    expect(result.data.team_stats).toHaveLength(1);
    expect(result.data.link_sections.social_media_links).toHaveLength(1);
    expect(result.data.link_sections.website_links).toHaveLength(1);
    expect(result.data.link_sections.video_links).toHaveLength(1);
  });
});
