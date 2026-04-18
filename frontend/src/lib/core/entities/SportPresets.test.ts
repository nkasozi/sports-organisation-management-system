import { describe, expect, it } from "vitest";

import { create_basketball_sport_preset } from "./Sport";

describe("SportPresets", () => {
  it("uses explicit empty and default values for basketball optional rules", () => {
    const basketball_preset = create_basketball_sport_preset();

    expect(
      basketball_preset.foul_categories.every(
        (current_foul_category) => current_foul_category.results_in_card === "",
      ),
    ).toBe(true);
    expect(basketball_preset.overtime_rules.penalties_config).toEqual({
      initial_rounds: 5,
      sudden_death_after: true,
    });
    expect(basketball_preset.substitution_rules.max_substitution_windows).toBe(
      -1,
    );
  });
});
