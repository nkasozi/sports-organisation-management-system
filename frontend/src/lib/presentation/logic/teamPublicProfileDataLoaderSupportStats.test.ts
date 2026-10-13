import { describe, expect, it } from "vitest";

import { build_public_team_stats_bundle } from "./teamPublicProfileDataLoaderSupport";

const TEAM = { id: "team-1", name: "City Hawks" };

function create_fixture(
  id: string,
  competition_id: string,
  status: string,
  scheduled_date: string,
): Record<string, unknown> {
  return {
    id,
    competition_id,
    home_team_id: "team-1",
    away_team_id: "team-2",
    status,
    home_team_score: 1,
    away_team_score: 1,
    scheduled_date,
    game_events: [],
  };
}

function list_of(items: unknown[]): () => Promise<unknown> {
  return async () => ({ success: true, data: { items } });
}

const UPCOMING_DATES = [
  "2024-07-06",
  "2024-07-01",
  "2024-07-05",
  "2024-07-02",
  "2024-07-04",
  "2024-07-03",
];

describe("teamPublicProfileDataLoaderSupport stats bundle", () => {
  it("orders competitions by matches played and keeps the five earliest upcoming fixtures", async () => {
    const fixtures = [
      create_fixture("cup-1", "cup", "completed", "2024-05-01"),
      create_fixture("league-1", "league", "completed", "2024-05-01"),
      create_fixture("league-2", "league", "completed", "2024-05-08"),
      create_fixture("unknown-1", "unknown", "completed", "2024-05-01"),
      {
        ...create_fixture("other", "cup", "completed", "2024-05-01"),
        home_team_id: "team-3",
      },
      ...UPCOMING_DATES.map((date, index) =>
        create_fixture(`cup-upcoming-${index}`, "cup", "scheduled", date),
      ),
    ];

    const bundle = await build_public_team_stats_bundle(
      {
        dependencies: {
          team_use_cases: { list: async () => ({ success: false }) },
          fixture_use_cases: { list: list_of(fixtures) },
          competition_use_cases: {
            list: list_of([
              { id: "cup", name: "Cup" },
              { id: "league", name: "League" },
            ]),
          },
        },
      } as never,
      TEAM as never,
    );

    expect(bundle.competition_stats.map((stat) => stat.competition.id)).toEqual(
      ["league", "cup"],
    );
    expect(bundle.overall_stats.total_matches).toBe(3);
    expect(bundle.overall_stats.draws).toBe(3);
    expect(
      bundle.competition_stats[1].upcoming_fixtures.map(
        (fixture) => fixture.scheduled_date,
      ),
    ).toEqual([
      "2024-07-01",
      "2024-07-02",
      "2024-07-03",
      "2024-07-04",
      "2024-07-05",
    ]);
    expect(bundle.teams_by_id).toEqual(new Map([["team-1", TEAM]]));
  });
});
