import { describe, expect, it } from "vitest";

import { load_team_public_profile_page_data } from "./teamPublicProfileDataLoader";
import {
  create_competition,
  create_fixture,
  create_game_event,
  create_profile_link,
  create_team,
  create_team_profile,
} from "./teamPublicProfileDataLoader.test_support";

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
        home_team_score: 0,
        away_team_score: 0,
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
