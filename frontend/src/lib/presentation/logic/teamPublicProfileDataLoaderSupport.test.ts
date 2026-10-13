import { describe, expect, it } from "vitest";

import {
  build_public_team_stats_bundle,
  load_public_team,
  load_public_team_profile,
  load_public_team_profile_links,
} from "./teamPublicProfileDataLoaderSupport";
import {
  build_completed_public_team_fixture,
  build_scheduled_public_team_fixture,
  EMPTY_PUBLIC_TEAM_STATS,
  SINGLE_WIN_PUBLIC_TEAM_STATS,
} from "./teamPublicProfileDataLoaderSupport.test_support";

describe("teamPublicProfileDataLoaderSupport", () => {
  it("returns not found and restricted errors for missing or private team profiles", async () => {
    expect(
      await load_public_team_profile({
        slug: "missing",
        dependencies: {
          profile_use_cases: {
            get_by_slug: async () => ({ success: false }),
          },
        },
      } as never),
    ).toEqual({
      success: false,
      error: {
        kind: "not_found",
        message: "Team profile not found",
      },
    });

    expect(
      await load_public_team_profile({
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
      error: {
        kind: "restricted",
        message: "This profile is private",
      },
    });
  });

  it("loads the team and profile links when dependencies succeed", async () => {
    const team = { id: "team-1", name: "City Hawks" };

    expect(
      await load_public_team(
        {
          dependencies: {
            team_use_cases: {
              get_by_id: async () => ({ success: true, data: team }),
            },
          },
        } as never,
        { team_id: "team-1" } as never,
      ),
    ).toEqual({ success: true, data: team });

    expect(
      await load_public_team_profile_links(
        {
          dependencies: {
            profile_link_use_cases: {
              list_by_profile: async () => ({
                success: true,
                data: {
                  items: [
                    {
                      id: "link-1",
                      platform: "website",
                      url: "https://club.test",
                    },
                  ],
                },
              }),
            },
          },
        } as never,
        { id: "profile-1" } as never,
      ),
    ).toEqual([
      { id: "link-1", platform: "website", url: "https://club.test" },
    ]);
  });

  it("builds team stats bundles and falls back to empty stats when fixture or competition loading fails", async () => {
    expect(
      await build_public_team_stats_bundle(
        {
          dependencies: {
            team_use_cases: {
              list: async () => ({ success: true, data: { items: [] } }),
            },
            fixture_use_cases: { list: async () => ({ success: false }) },
            competition_use_cases: {
              list: async () => ({ success: true, data: { items: [] } }),
            },
          },
        } as never,
        { id: "team-1", name: "City Hawks" } as never,
      ),
    ).toEqual({
      overall_stats: EMPTY_PUBLIC_TEAM_STATS,
      competition_stats: [],
      teams_by_id: new Map([["team-1", { id: "team-1", name: "City Hawks" }]]),
    });

    expect(
      await build_public_team_stats_bundle(
        {
          dependencies: {
            team_use_cases: {
              list: async () => ({
                success: true,
                data: {
                  items: [
                    { id: "team-1", name: "City Hawks" },
                    { id: "team-2", name: "Northern Lions" },
                  ],
                },
              }),
            },
            fixture_use_cases: {
              list: async () => ({
                success: true,
                data: {
                  items: [
                    build_completed_public_team_fixture(),
                    build_scheduled_public_team_fixture(),
                  ],
                },
              }),
            },
            competition_use_cases: {
              list: async () => ({
                success: true,
                data: {
                  items: [{ id: "competition-1", name: "Premier League" }],
                },
              }),
            },
          },
        } as never,
        { id: "team-1", name: "City Hawks" } as never,
      ),
    ).toEqual({
      overall_stats: SINGLE_WIN_PUBLIC_TEAM_STATS,
      competition_stats: [
        {
          competition: { id: "competition-1", name: "Premier League" },
          stats: SINGLE_WIN_PUBLIC_TEAM_STATS,
          upcoming_fixtures: [build_scheduled_public_team_fixture()],
        },
      ],
      teams_by_id: new Map([
        ["team-1", { id: "team-1", name: "City Hawks" }],
        ["team-2", { id: "team-2", name: "Northern Lions" }],
      ]),
    });
  });
});
