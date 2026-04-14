import { describe, expect, it } from "vitest";

import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";
import type { TeamProfile } from "$lib/core/entities/TeamProfile";

import { load_team_public_profile_page_data } from "./teamPublicProfileDataLoader";

function create_team_profile(
  overrides: Partial<ScalarInput<TeamProfile>> = {},
): TeamProfile {
  return {
    id: "profile_1",
    team_id: "team_1",
    profile_summary: "Historic club",
    visibility: "public",
    profile_slug: "kampala-queens",
    featured_image_url: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as TeamProfile;
}

function create_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
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
  } as Team;
}

function create_competition(
  overrides: Partial<ScalarInput<Competition>> = {},
): Competition {
  return {
    id: "competition_1",
    name: "National League",
    description: "",
    organization_id: "org_1",
    competition_format_id: "format_1",
    team_ids: ["team_1", "team_2"],
    allow_auto_squad_submission: false,
    squad_generation_strategy: "first_available",
    allow_auto_fixture_details_setup: false,
    lineup_submission_deadline_hours: 24,
    start_date: "2026-04-01",
    end_date: "2026-07-01",
    registration_deadline: "2026-03-01",
    max_teams: 12,
    entry_fee: 0,
    prize_pool: 0,
    location: "Kampala",
    rule_overrides: {},
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Competition;
}

function create_game_event(
  overrides: Partial<ScalarInput<GameEvent>> = {},
): GameEvent {
  return {
    id: "event_1",
    event_type: "yellow_card",
    minute: 33,
    stoppage_time_minute: null,
    team_side: "home",
    player_name: "Jane Doe",
    secondary_player_name: "",
    description: "",
    recorded_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as GameEvent;
}

function create_fixture(overrides: Partial<ScalarInput<Fixture>> = {}): Fixture {
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
  } as Fixture;
}

function create_profile_link(
  overrides: Partial<ScalarInput<ProfileLink>> = {},
): ProfileLink {
  return {
    id: "link_1",
    profile_id: "profile_1",
    platform: "website",
    title: "Club Website",
    url: "https://example.com",
    display_order: 1,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as ProfileLink;
}

describe("teamPublicProfileDataLoader", () => {
  it("returns not found when the slug has no profile", async () => {
    const result = await load_team_public_profile_page_data({
      slug: "missing-team",
      dependencies: {
        profile_use_cases: { get_by_slug: async () => ({ success: false }) },
        team_use_cases: {
          get_by_id: async () => ({ success: false }),
          list: async () => ({ success: true, data: { items: [] } }),
        },
        fixture_use_cases: {
          list: async () => ({ success: true, data: { items: [] } }),
        },
        competition_use_cases: {
          list: async () => ({ success: true, data: { items: [] } }),
        },
        profile_link_use_cases: {
          list_by_profile: async () => ({ success: true, data: { items: [] } }),
        },
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.kind).toBe("not_found");
  });

  it("loads overall and competition stats with capped upcoming fixtures", async () => {
    const upcoming_fixtures = [1, 2, 3, 4, 5, 6].map((day_number: number) =>
      create_fixture({
        id: `fixture_${day_number}`,
        scheduled_date: `2026-04-0${day_number}`,
        status: "scheduled",
        home_team_score: null,
        away_team_score: null,
      }),
    );
    const dependencies = {
      profile_use_cases: {
        get_by_slug: async () => ({
          success: true,
          data: create_team_profile(),
        }),
      },
      team_use_cases: {
        get_by_id: async () => ({
          success: true,
          data: create_team(),
        }),
        list: async () => ({
          success: true,
          data: {
            items: [
              create_team(),
              create_team({ id: "team_2", name: "Jinja Stars" }),
            ],
          },
        }),
      },
      fixture_use_cases: {
        list: async () => ({
          success: true,
          data: {
            items: [
              create_fixture({ game_events: [create_game_event()] }),
              ...upcoming_fixtures,
            ],
          },
        }),
      },
      competition_use_cases: {
        list: async () => ({
          success: true,
          data: { items: [create_competition()] },
        }),
      },
      profile_link_use_cases: {
        list_by_profile: async () => ({
          success: true,
          data: { items: [create_profile_link()] },
        }),
      },
    };

    const result = await load_team_public_profile_page_data({
      slug: "kampala-queens",
      dependencies: dependencies as never,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.overall_stats.total_matches).toBe(1);
    expect(result.data.overall_stats.wins).toBe(1);
    expect(result.data.overall_stats.yellow_cards).toBe(1);
    expect(result.data.profile_links).toHaveLength(1);
    expect(result.data.teams_by_id.get("team_2")?.name).toBe("Jinja Stars");
    expect(result.data.competition_stats).toHaveLength(1);
    expect(result.data.competition_stats[0].upcoming_fixtures).toHaveLength(5);
    expect(
      result.data.competition_stats[0].upcoming_fixtures[0].scheduled_date,
    ).toBe("2026-04-01");
    expect(
      result.data.competition_stats[0].upcoming_fixtures[4].scheduled_date,
    ).toBe("2026-04-05");
  });
});
