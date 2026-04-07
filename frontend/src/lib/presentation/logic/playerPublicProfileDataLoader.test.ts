import { describe, expect, it } from "vitest";

import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";

import { load_player_public_profile_page_data } from "./playerPublicProfileDataLoader";

function create_player_profile(
  overrides: Partial<PlayerProfile> = {},
): PlayerProfile {
  return {
    id: "profile_1",
    player_id: "player_1",
    profile_summary: "Fast winger",
    visibility: "public",
    profile_slug: "jane-doe",
    featured_image_url: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_player(overrides: Partial<Player> = {}): Player {
  return {
    id: "player_1",
    first_name: "Jane",
    last_name: "Doe",
    gender_id: "gender_1",
    email: "",
    phone: "",
    date_of_birth: "2000-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 168,
    weight_kg: 58,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_notes: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_position(
  overrides: Partial<PlayerPosition> = {},
): PlayerPosition {
  return {
    id: "position_1",
    name: "Winger",
    code: "WG",
    category: "forward",
    description: "",
    sport_type: "Football",
    display_order: 1,
    is_available: true,
    status: "active",
    organization_id: "org_1",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_team(overrides: Partial<Team> = {}): Team {
  return {
    id: "team_1",
    name: "Kampala Queens",
    short_name: "KQ",
    description: "",
    organization_id: "org_1",
    gender_id: "gender_1",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "venue_1",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    logo_url: "",
    website: "",
    founded_year: 2010,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_membership(
  overrides: Partial<PlayerTeamMembership> = {},
): PlayerTeamMembership {
  return {
    id: "membership_1",
    organization_id: "org_1",
    player_id: "player_1",
    team_id: "team_1",
    start_date: "2025-01-01",
    jersey_number: 7,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_game_event(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: null,
    team_side: "home",
    player_name: "Jane Doe",
    secondary_player_name: "Mary Smith",
    description: "",
    recorded_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    venue: "Main Ground",
    scheduled_date: "2026-04-07",
    scheduled_time: "15:00",
    home_team_score: 2,
    away_team_score: 1,
    assigned_officials: [],
    game_events: [],
    current_period: "finished",
    current_minute: 90,
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "completed",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function create_profile_link(
  overrides: Partial<ProfileLink> = {},
): ProfileLink {
  return {
    id: "link_1",
    profile_id: "profile_1",
    platform: "instagram",
    title: "Instagram",
    url: "https://example.com",
    display_order: 1,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

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

    expect(result.data.position?.name).toBe("Winger");
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
