import { describe, expect, it } from "vitest";

import {
  create_basketball_sport_preset,
  create_field_hockey_sport_preset,
} from "$lib/core/entities/Sport";

import { build_sport_rule_overrides } from "./competitionSportScoringDefaults";

describe("competition scoring follows the sport", () => {
  it("gives basketball two points for a win and one for a loss", () => {
    const sport = create_basketball_sport_preset() as never;
    expect(build_sport_rule_overrides({ status: "present", sport })).toEqual({
      points_config_override: {
        points_for_win: 2,
        points_for_draw: 0,
        points_for_loss: 1,
      },
    });
  });

  it("leaves other sports on their format's points", () => {
    const sport = create_field_hockey_sport_preset() as never;
    expect(build_sport_rule_overrides({ status: "present", sport })).toEqual(
      {},
    );
    expect(build_sport_rule_overrides({ status: "missing" })).toEqual({});
  });
});
