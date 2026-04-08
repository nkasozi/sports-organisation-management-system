import { describe, expect, it } from "vitest";

import { build_team_form_map } from "./competitionStandingsForm";

describe("competitionStandingsForm", () => {
  it("sorts fixture form chronologically and keeps only the last requested results", () => {
    const form_map = build_team_form_map(
      [
        {
          home_team_id: "team-a",
          away_team_id: "team-b",
          home_team_score: 2,
          away_team_score: 1,
          scheduled_date: "2024-01-10T10:00:00.000Z",
        },
        {
          home_team_id: "team-a",
          away_team_id: "team-c",
          home_team_score: 0,
          away_team_score: 1,
          scheduled_date: "2024-03-10T10:00:00.000Z",
        },
        {
          home_team_id: "team-b",
          away_team_id: "team-a",
          home_team_score: 1,
          away_team_score: 1,
          scheduled_date: "2024-02-10T10:00:00.000Z",
        },
      ] as never,
      2,
    );

    expect(form_map.get("team-a")).toEqual(["D", "L"]);
    expect(form_map.get("team-b")).toEqual(["L", "D"]);
    expect(form_map.get("team-c")).toEqual(["W"]);
  });
});
