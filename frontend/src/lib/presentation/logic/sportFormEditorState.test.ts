import { describe, expect, it } from "vitest";

import type { Sport } from "$lib/core/entities/Sport";
import { create_empty_sport_input } from "$lib/core/entities/Sport";

import {
  add_card_type,
  add_game_period,
  apply_sport_preset,
  create_sport_form_data_from_sport,
  generate_sport_identifier,
  remove_game_period,
} from "./sportFormEditorState";

function create_test_sport(): Sport {
  const base_input = create_empty_sport_input();
  return {
    ...base_input,
    id: "sport_1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  } as Sport;
}

describe("apply_sport_preset", () => {
  it("returns the requested preset data", () => {
    const preset = apply_sport_preset("basketball");

    expect(preset.code).toBe("BASKETBALL");
    expect(preset.name.length).toBeGreaterThan(0);
  });
});

describe("generate_sport_identifier", () => {
  it("normalizes a name into an identifier", () => {
    expect(generate_sport_identifier("Yellow Card!")).toBe("yellow_card");
  });
});

describe("add_game_period", () => {
  it("appends a default period with the next order", () => {
    const form_data = create_empty_sport_input();
    const updated_form_data = add_game_period(form_data);
    const last_period =
      updated_form_data.periods[updated_form_data.periods.length - 1];

    expect(updated_form_data.periods).toHaveLength(
      form_data.periods.length + 1,
    );
    expect(last_period.order).toBe(updated_form_data.periods.length);
    expect(last_period.id).toBe(`period_${updated_form_data.periods.length}`);
  });
});

describe("remove_game_period", () => {
  it("removes a period and reorders the remaining periods", () => {
    const form_data = add_game_period(create_empty_sport_input());
    const updated_form_data = remove_game_period(form_data, 0);

    expect(updated_form_data.periods).toHaveLength(
      form_data.periods.length - 1,
    );
    expect(
      updated_form_data.periods.map((current_period) => current_period.order),
    ).toEqual(updated_form_data.periods.map((_, index) => index + 1));
  });
});

describe("add_card_type", () => {
  it("appends a default card type", () => {
    const form_data = create_empty_sport_input();
    const updated_form_data = add_card_type(form_data);
    const last_card =
      updated_form_data.card_types[updated_form_data.card_types.length - 1];

    expect(updated_form_data.card_types).toHaveLength(
      form_data.card_types.length + 1,
    );
    expect(last_card.severity).toBe("warning");
  });
});

describe("create_sport_form_data_from_sport", () => {
  it("clones nested sport data for safe editing", () => {
    const sport = create_test_sport();
    const form_data = create_sport_form_data_from_sport(sport);

    expect(form_data).toEqual(
      expect.objectContaining({ name: sport.name, code: sport.code }),
    );
    expect(form_data.periods).not.toBe(sport.periods);
    expect(form_data.card_types).not.toBe(sport.card_types);
    expect(form_data.overtime_rules).not.toBe(sport.overtime_rules);
  });
});
