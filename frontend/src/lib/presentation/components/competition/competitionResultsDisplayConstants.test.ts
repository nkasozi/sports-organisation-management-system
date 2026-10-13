import { describe, expect, it } from "vitest";

import {
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
