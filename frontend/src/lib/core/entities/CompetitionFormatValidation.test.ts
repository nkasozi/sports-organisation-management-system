import { describe, expect, it } from "vitest";

import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";
import { hydrate_competition_format_input } from "./CompetitionFormatValidation";

describe("CompetitionFormatValidation", () => {
  it("hydrates every config with explicit defaults", () => {
    const hydrated_input = hydrate_competition_format_input({
      name: "Cup Tournament",
      code: "cup_tournament",
      description: "Single elimination knockout tournament",
      format_type: "straight_knockout",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: ["draw"],
      group_stage_config: create_default_group_stage_config(),
      knockout_stage_config: create_default_knockout_stage_config(),
      league_config: create_default_league_config(),
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 64,
      status: "active",
      organization_id: "",
    });

    expect(hydrated_input.group_stage_config).toEqual(
      create_default_group_stage_config(),
    );
    expect(hydrated_input.knockout_stage_config).toEqual(
      create_default_knockout_stage_config(),
    );
    expect(hydrated_input.league_config).toEqual(
      create_default_league_config(),
    );
  });
});
