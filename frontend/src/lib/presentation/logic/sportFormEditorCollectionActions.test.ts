import { describe, expect, it } from "vitest";

import { create_empty_sport_input } from "$lib/core/entities/Sport";

import {
  add_card_type,
  add_foul_category,
  add_game_period,
  add_official_requirement,
  add_scoring_rule,
  remove_card_type,
  remove_foul_category,
  remove_game_period,
  remove_official_requirement,
  remove_scoring_rule,
} from "./sportFormEditorCollectionActions";

describe("sportFormEditorCollectionActions", () => {
  it("adds and reorders game periods", () => {
    const initial_form_data = create_empty_sport_input();
    const next_period_index = initial_form_data.periods.length + 1;

    const with_extra_period = add_game_period(initial_form_data);
    expect(with_extra_period.periods.at(-1)).toEqual({
      id: `period_${next_period_index}`,
      name: `Period ${next_period_index}`,
      duration_minutes: 15,
      is_break: false,
      order: next_period_index,
    });

    const with_removed_period = remove_game_period(with_extra_period, 1);
    expect(with_removed_period.periods).toEqual(
      with_extra_period.periods
        .filter((_, current_index: number) => current_index !== 1)
        .map((current_period, current_index: number) => ({
          ...current_period,
          order: current_index + 1,
        })),
    );
  });

  it("adds and removes collection entries with their default values", () => {
    const initial_form_data = create_empty_sport_input();
    const next_card_type_index = initial_form_data.card_types.length + 1;
    const next_foul_category_index =
      initial_form_data.foul_categories.length + 1;
    const next_official_requirement_index =
      initial_form_data.official_requirements.length + 1;

    const with_card_type = add_card_type(initial_form_data);
    expect(with_card_type.card_types.at(-1)).toEqual({
      id: `card_${next_card_type_index}`,
      name: "",
      color: "#FBBF24",
      severity: "warning",
      description: "",
      consequences: [],
    });
    expect(remove_card_type(with_card_type, 0).card_types).toEqual(
      with_card_type.card_types.slice(1),
    );

    const with_foul_category = add_foul_category(initial_form_data);
    expect(with_foul_category.foul_categories.at(-1)).toEqual({
      id: `foul_${next_foul_category_index}`,
      name: "",
      severity: "minor",
      description: "",
      typical_penalty: "",
      results_in_card: "",
    });
    expect(remove_foul_category(with_foul_category, 0).foul_categories).toEqual(
      with_foul_category.foul_categories.slice(1),
    );

    const with_official_requirement =
      add_official_requirement(initial_form_data);
    expect(with_official_requirement.official_requirements.at(-1)).toEqual({
      role_id: `official_${next_official_requirement_index}`,
      role_name: "",
      minimum_count: 1,
      maximum_count: 1,
      is_mandatory: true,
      description: "",
    });
    expect(
      remove_official_requirement(with_official_requirement, 0)
        .official_requirements,
    ).toEqual(with_official_requirement.official_requirements.slice(1));

    const with_scoring_rule = add_scoring_rule(initial_form_data);
    expect(with_scoring_rule.scoring_rules.at(-1)).toEqual({
      event_type: "",
      points_awarded: 1,
      description: "",
    });
    expect(remove_scoring_rule(with_scoring_rule, 0).scoring_rules).toEqual(
      with_scoring_rule.scoring_rules.slice(1),
    );
  });
});
