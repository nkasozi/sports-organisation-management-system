import { describe, expect, it } from "vitest";

import { infer_group_stage_team_groups } from "./groupStageInference";

describe("groupStageInference", () => {
  it("builds connected group-stage team clusters in first-seen order", () => {
    expect(
      infer_group_stage_team_groups([
        { home_team_id: "team-a", away_team_id: "team-b" },
        { home_team_id: "team-b", away_team_id: "team-c" },
        { home_team_id: "team-d", away_team_id: "team-e" },
        { home_team_id: "team-f", away_team_id: "   " },
      ] as never),
    ).toEqual([
      ["team-a", "team-b", "team-c"],
      ["team-d", "team-e"],
      ["team-f"],
    ]);
  });
});
