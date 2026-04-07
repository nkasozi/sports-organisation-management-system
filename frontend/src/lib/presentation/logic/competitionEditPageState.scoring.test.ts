import { describe, expect, it } from "vitest";

import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";

import {
  normalize_competition_auto_squad_settings,
  reset_competition_scoring_overrides,
  toggle_competition_tie_breaker,
  update_competition_points_override,
} from "./competitionEditPageState";
import { create_test_competition } from "./competitionEditPageState.testData";

describe("scoring overrides", () => {
  it("updates a scoring override when the value is numeric", () => {
    const updated_form_data = update_competition_points_override(
      create_test_competition({}),
      "points_for_win",
      "5",
    );

    expect(
      updated_form_data.rule_overrides?.points_config_override?.points_for_win,
    ).toBe(5);
  });

  it("toggles tie breakers against format defaults", () => {
    const format_default_tie_breakers: TieBreaker[] = [
      "goal_difference",
      "goals_scored",
    ];

    const with_added_tie_breaker = toggle_competition_tie_breaker(
      create_test_competition({}),
      "head_to_head",
      true,
      format_default_tie_breakers,
    );
    const with_removed_tie_breaker = toggle_competition_tie_breaker(
      with_added_tie_breaker,
      "goal_difference",
      false,
      format_default_tie_breakers,
    );

    expect(
      with_added_tie_breaker.rule_overrides?.tie_breakers_override,
    ).toEqual(["goal_difference", "goals_scored", "head_to_head"]);
    expect(
      with_removed_tie_breaker.rule_overrides?.tie_breakers_override,
    ).toEqual(["goals_scored", "head_to_head"]);
  });

  it("clears only the scoring override fields when resetting", () => {
    const reset_form_data = reset_competition_scoring_overrides(
      create_test_competition({
        rule_overrides: {
          custom_rules: { travel_window: "48h" },
          points_config_override: { points_for_win: 4 },
          tie_breakers_override: ["head_to_head"],
        },
      }),
    );

    expect(reset_form_data.rule_overrides).toEqual({
      custom_rules: { travel_window: "48h" },
      points_config_override: undefined,
      tie_breakers_override: undefined,
    });
  });
});

describe("normalize_competition_auto_squad_settings", () => {
  it("enables auto squad submission when a deadline is configured", () => {
    const normalized_form_data = normalize_competition_auto_squad_settings(
      create_test_competition({
        allow_auto_squad_submission: false,
        lineup_submission_deadline_hours: 3,
        squad_generation_strategy: "" as never,
      }),
    );

    expect(normalized_form_data.allow_auto_squad_submission).toBe(true);
    expect(normalized_form_data.squad_generation_strategy).toBe(
      "first_available",
    );
  });
});
