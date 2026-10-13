import { describe, expect, it } from "vitest";

import { get_default_competition_formats_for_organization } from "./CompetitionFormatDefaults";
import {
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";

const ORGANIZATION_ID = "org-1" as Parameters<
  typeof get_default_competition_formats_for_organization
>[0];

describe("get_default_competition_formats_for_organization", () => {
  const formats =
    get_default_competition_formats_for_organization(ORGANIZATION_ID);

  it("returns the five default formats in order with org-scoped ids", () => {
    expect(formats.map((format) => format.code)).toEqual([
      "standard_league",
      "single_round_robin",
      "world_cup_style",
      "cup_tournament",
      "champions_league_style",
    ]);
    expect(formats[0].id).toBe("comp_fmt_default_1_org-1");
    expect(formats.every((format) => format.organization_id === "org-1")).toBe(
      true,
    );
  });

  it("applies per-format config overrides on top of factory defaults", () => {
    expect(formats[1].league_config).toEqual({
      ...create_default_league_config(),
      number_of_rounds: 1,
    });
    expect(formats[3].knockout_stage_config).toEqual({
      ...create_default_knockout_stage_config(),
      third_place_match: false,
    });
    expect(formats[4].knockout_stage_config).toEqual({
      ...create_default_knockout_stage_config(),
      two_legged_ties: true,
      away_goals_rule: true,
    });
  });

  it("hydrates stage templates and shared defaults", () => {
    expect(formats[1].stage_templates).toEqual([
      { name: "Round Robin", stage_type: "league_stage", stage_order: 1 },
    ]);
    expect(formats[3].stage_templates).toHaveLength(4);
    expect(
      formats.every(
        (format) =>
          format.status === "active" &&
          format.min_teams_required === 2 &&
          format.points_config.points_for_win === 3,
      ),
    ).toBe(true);
    expect(formats.map((format) => format.max_teams_allowed)).toEqual([
      24, 16, 32, 64, 32,
    ]);
  });
});
