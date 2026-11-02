import { describe, expect, it } from "vitest";

import {
  describe_completed_results_count,
  get_standing_form_classes,
  get_standing_form_label,
  STANDING_FORM_RESULT,
} from "./competitionResultsDisplayConstants";

describe("standing form display", () => {
  it("colours wins, draws and losses", () => {
    expect(get_standing_form_classes(STANDING_FORM_RESULT.WIN)).toContain(
      "green",
    );
    expect(get_standing_form_classes(STANDING_FORM_RESULT.DRAW)).toContain(
      "gray",
    );
    expect(get_standing_form_classes(STANDING_FORM_RESULT.LOSS)).toContain(
      "red",
    );
  });

  it("shows a cross for losses", () => {
    expect(get_standing_form_label(STANDING_FORM_RESULT.LOSS)).toBe("✕");
    expect(get_standing_form_label(STANDING_FORM_RESULT.WIN)).toBe("W");
  });
});

describe("describe_completed_results_count", () => {
  it("shows the total when nothing is filtered out", () => {
    expect(describe_completed_results_count(20, 20)).toBe(
      "20 completed matches",
    );
    expect(describe_completed_results_count(1, 1)).toBe("1 completed match");
  });

  it("shows how many of the total match a search", () => {
    expect(describe_completed_results_count(3, 20)).toBe(
      "3 of 20 completed matches",
    );
    expect(describe_completed_results_count(0, 20)).toBe(
      "0 of 20 completed matches",
    );
  });
});
