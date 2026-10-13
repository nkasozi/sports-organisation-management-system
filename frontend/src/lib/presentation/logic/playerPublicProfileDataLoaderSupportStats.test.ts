import { describe, expect, it } from "vitest";

import { build_public_player_stats_bundle } from "./playerPublicProfileDataLoaderSupport";

const PLAYER = { id: "player-1", first_name: "Jane", last_name: "Doe" };

function list_of(items: unknown[]): () => Promise<unknown> {
  return async () => ({ success: true, data: { items } });
}

function create_command(
  teams_list: () => Promise<unknown>,
): Record<string, unknown> {
  return {
    dependencies: {
      membership_use_cases: {
        list: list_of([
          { id: "membership-1", player_id: "player-1", team_id: "team-1" },
          { id: "membership-2", player_id: "player-1", team_id: "missing" },
          { id: "membership-3", player_id: "player-2", team_id: "team-1" },
        ]),
      },
      team_use_cases: { list: teams_list },
      fixture_use_cases: {
        list: list_of([
          {
            id: "fixture-1",
            status: "completed",
            home_team_id: "team-2",
            away_team_id: "team-1",
          },
          {
            id: "fixture-2",
            status: "scheduled",
            home_team_id: "team-1",
            away_team_id: "team-2",
            game_events: [],
          },
        ]),
      },
    },
  };
}

describe("playerPublicProfileDataLoaderSupport stats bundle", () => {
  it("only counts completed fixtures for the player's known teams", async () => {
    const bundle = await build_public_player_stats_bundle(
      create_command(list_of([{ id: "team-1", name: "City Hawks" }])) as never,
      PLAYER as never,
    );

    expect(bundle.team_stats).toHaveLength(1);
    expect(bundle.team_stats[0].membership.id).toBe("membership-1");
    expect(bundle.team_stats[0].stats.total_matches).toBe(1);
    expect(bundle.team_stats[0].stats.goals).toBe(0);
    expect(bundle.overall_stats.total_matches).toBe(1);
  });

  it("returns no team stats when teams cannot be listed", async () => {
    const bundle = await build_public_player_stats_bundle(
      create_command(async () => ({ success: false })) as never,
      PLAYER as never,
    );

    expect(bundle.team_stats).toEqual([]);
    expect(bundle.overall_stats.total_matches).toBe(0);
  });
});
