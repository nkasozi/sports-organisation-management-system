import { describe, expect, it } from "vitest";

import {
  derive_stats_available_teams,
  filter_and_sort_assisters,
  filter_and_sort_scorers,
  type PlayerStats,
} from "./competitionResultsStats";

describe("competition results stats filters", () => {
  const player_stats: PlayerStats[] = [
    {
      player_key: "Alex|team_1",
      player_name: "Alex",
      team_name: "Falcons",
      points: 4,
      assists: 0,
      card_counts: { yellow_card: 1 },
      moments: [],
    },
    {
      player_key: "Sam|team_2",
      player_name: "Sam",
      team_name: "Wolves",
      points: 2,
      assists: 0,
      card_counts: { red_card: 1 },
      moments: [],
    },
    {
      player_key: "Jamie|team_1",
      player_name: "Jamie",
      team_name: "Falcons",
      points: 0,
      assists: 0,
      card_counts: { yellow_card: 3 },
      moments: [],
    },
  ];

  it("derives sorted unique team names", () => {
    expect(derive_stats_available_teams(player_stats)).toEqual([
      "Falcons",
      "Wolves",
    ]);
  });

  it("lists only players with assists, most first", () => {
    const with_assists = [
      { ...player_stats[0], assists: 1 },
      { ...player_stats[1], assists: 3 },
      player_stats[2],
    ];

    expect(
      filter_and_sort_assisters(with_assists, "all").map(
        (player) => player.player_name,
      ),
    ).toEqual(["Sam", "Alex"]);
  });

  it("filters and sorts top scorers by team", () => {
    expect(filter_and_sort_scorers(player_stats, "Falcons")).toEqual([
      player_stats[0],
    ]);
  });
});
