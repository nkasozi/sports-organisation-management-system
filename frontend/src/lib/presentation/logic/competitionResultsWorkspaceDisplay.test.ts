import { describe, expect, it } from "vitest";

import {
  competition_results_page_size_options,
  format_competition_results_date,
  get_competition_results_extended_competition_name,
  get_competition_results_extended_team_name,
  get_competition_results_stage_name,
  get_competition_results_stage_type,
  get_competition_results_team_logo_url,
  get_competition_results_team_name,
} from "./competitionResultsWorkspaceDisplay";

describe("competitionResultsWorkspaceDisplay", () => {
  it("exposes the supported page sizes and formats result dates for display", () => {
    expect(competition_results_page_size_options).toEqual([10, 20, 50]);
    expect(
      format_competition_results_date("2024-06-01T12:30:00.000Z"),
    ).toContain("Jun");
  });

  it("resolves stage names and types with the expected fallbacks", () => {
    const competition_stages = [
      { id: "stage-1", name: "Pool Stage", stage_type: "group_stage" },
    ];
    const competition_stage_map = new Map([["stage-1", competition_stages[0]]]);

    expect(
      get_competition_results_stage_name(
        "",
        competition_stages as never,
        competition_stage_map as never,
      ),
    ).toBe("Unassigned Stage");
    expect(
      get_competition_results_stage_name(
        "missing",
        competition_stages as never,
        competition_stage_map as never,
      ),
    ).toBe("Unknown Stage");
    expect(
      get_competition_results_stage_name(
        "stage-1",
        competition_stages as never,
        competition_stage_map as never,
      ),
    ).toBe("Pool Stage");
    expect(
      get_competition_results_stage_type(
        "stage-1",
        competition_stage_map as never,
      ),
    ).toBe("Group Stage");
  });

  it("resolves team names, competition names, and logos from the extended maps with fallbacks", () => {
    const team_map = new Map([
      ["team-1", { id: "team-1", name: "Lions", logo_url: "/lions.svg" }],
    ]);
    const extended_team_map = new Map([
      ["team-2", { id: "team-2", name: "Falcons", logo_url: "" }],
    ]);
    const extended_competition_map = new Map([
      ["competition-1", { id: "competition-1", name: "League One" }],
    ]);

    expect(get_competition_results_team_name("team-1", team_map as never)).toBe(
      "Lions",
    );
    expect(
      get_competition_results_extended_team_name(
        "team-2",
        extended_team_map as never,
        team_map as never,
      ),
    ).toBe("Falcons");
    expect(
      get_competition_results_extended_competition_name(
        "competition-1",
        extended_competition_map as never,
      ),
    ).toBe("League One");
    expect(
      get_competition_results_extended_competition_name(
        "missing",
        extended_competition_map as never,
      ),
    ).toBe("Unknown Competition");
    expect(
      get_competition_results_team_logo_url(
        "team-1",
        team_map as never,
        extended_team_map as never,
      ),
    ).toBe("/lions.svg");
    expect(
      get_competition_results_team_logo_url(
        "missing",
        team_map as never,
        extended_team_map as never,
      ),
    ).toBe("");
  });
});
