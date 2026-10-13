import { describe, expect, it } from "vitest";

import {
  build_competition_stage_results_sections,
  calculate_team_standings,
  infer_group_stage_team_groups,
} from "./competitionStageResults";
import {
  create_fixture,
  create_stage,
  create_team,
} from "./competitionStageResults.test_support";

describe("competitionStageResults", () => {
  it("keeps disconnected fixtures as separate inferred groups", () => {
    const groups = infer_group_stage_team_groups([
      create_fixture("team-a", "team-b"),
      create_fixture("team-c", "team-d"),
    ]);

    expect(groups).toEqual([
      ["team-a", "team-b"],
      ["team-c", "team-d"],
    ]);
  });

  it("merges inferred groups when fixtures connect them", () => {
    const groups = infer_group_stage_team_groups([
      create_fixture("team-a", "team-b"),
      create_fixture("team-c", "team-d"),
      create_fixture("team-b", "team-c"),
    ]);

    expect(groups).toEqual([["team-a", "team-b", "team-c", "team-d"]]);
  });

  it("calculates standings from completed fixtures only", () => {
    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-b", "team-a", {
          status: "scheduled",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(3);
    expect(standings[1].played).toBe(1);
  });

  it("builds grouped stage sections for group stages", () => {
    const stage_sections = build_competition_stage_results_sections(
      [create_stage()],
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 0,
        }),
        create_fixture("team-c", "team-d", {
          home_team_score: 2,
          away_team_score: 2,
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
        create_team("team-d", "Team D"),
      ],
    );

    expect(stage_sections).toHaveLength(1);
    expect(stage_sections[0].inferred_groups).toHaveLength(2);
    expect(stage_sections[0].inferred_groups[0].label).toBe("Group A");
    expect(stage_sections[0].inferred_groups[1].label).toBe("Group B");
  });
});
