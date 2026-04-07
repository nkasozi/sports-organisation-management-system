import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";

import {
  calculate_player_public_profile_event_stats,
  create_empty_player_public_profile_stats,
  merge_player_public_profile_stats,
  split_player_public_profile_links,
} from "./playerPublicProfilePageState";

function create_game_event(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 12,
    stoppage_time_minute: null,
    team_side: "home",
    player_name: "Jordan Miles",
    secondary_player_name: "Alex Doe",
    description: "Goal",
    recorded_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_profile_link(
  overrides: Partial<ProfileLink> = {},
): ProfileLink {
  return {
    id: "link_1",
    profile_id: "profile_1",
    platform: "twitter",
    title: "Twitter",
    url: "https://example.com",
    display_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("playerPublicProfilePageState", () => {
  it("creates empty player profile stats", () => {
    expect(create_empty_player_public_profile_stats()).toEqual({
      total_matches: 0,
      goals: 0,
      own_goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      substitutions_in: 0,
      substitutions_out: 0,
    });
  });

  it("calculates event totals for the named player", () => {
    const result = calculate_player_public_profile_event_stats(
      [
        create_game_event(),
        create_game_event({ event_type: "yellow_card" }),
        create_game_event({
          event_type: "substitution",
          secondary_player_name: "Jordan Miles",
          player_name: "Alex Doe",
        }),
        create_game_event({ event_type: "red_card" }),
        create_game_event({
          event_type: "goal",
          secondary_player_name: "Jordan Miles",
          player_name: "Alex Doe",
        }),
      ],
      "Jordan Miles",
    );

    expect(result.goals).toBe(1);
    expect(result.assists).toBe(1);
    expect(result.yellow_cards).toBe(1);
    expect(result.red_cards).toBe(1);
    expect(result.substitutions_out).toBe(1);
  });

  it("merges two player stat objects", () => {
    const result = merge_player_public_profile_stats(
      {
        total_matches: 2,
        goals: 1,
        own_goals: 0,
        assists: 1,
        yellow_cards: 0,
        red_cards: 0,
        substitutions_in: 1,
        substitutions_out: 0,
      },
      {
        total_matches: 1,
        goals: 2,
        own_goals: 1,
        assists: 0,
        yellow_cards: 1,
        red_cards: 1,
        substitutions_in: 0,
        substitutions_out: 1,
      },
    );

    expect(result).toEqual({
      total_matches: 3,
      goals: 3,
      own_goals: 1,
      assists: 1,
      yellow_cards: 1,
      red_cards: 1,
      substitutions_in: 1,
      substitutions_out: 1,
    });
  });

  it("splits links into social, website, and video groups", () => {
    const result = split_player_public_profile_links([
      create_profile_link({ id: "social_1", platform: "instagram" }),
      create_profile_link({ id: "website_1", platform: "website" }),
      create_profile_link({ id: "video_1", platform: "youtube" }),
    ]);

    expect(result.social_media_links.map((link) => link.id)).toEqual([
      "social_1",
    ]);
    expect(result.website_links.map((link) => link.id)).toEqual(["website_1"]);
    expect(result.video_links.map((link) => link.id)).toEqual(["video_1"]);
  });
});
