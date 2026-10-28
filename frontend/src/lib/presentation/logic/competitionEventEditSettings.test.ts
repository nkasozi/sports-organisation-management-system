import { describe, expect, it } from "vitest";

import {
  build_max_event_edits_hint,
  normalize_competition_event_edit_settings,
} from "./competitionEventEditSettings";

describe("competitionEventEditSettings", () => {
  it("coerces the event edit limit to a whole number and defaults blanks to 3", () => {
    expect(
      normalize_competition_event_edit_settings({
        name: "League",
        max_event_edits_per_game: 4.4,
      }),
    ).toEqual({ name: "League", max_event_edits_per_game: 4 });
    expect(
      normalize_competition_event_edit_settings({
        max_event_edits_per_game: "" as never,
      }),
    ).toEqual({ max_event_edits_per_game: 3 });
    expect(
      normalize_competition_event_edit_settings({
        max_event_edits_per_game: 0,
      }),
    ).toEqual({ max_event_edits_per_game: 0 });
  });

  it("leaves partial updates without the field untouched", () => {
    const form_data: { name: string; max_event_edits_per_game?: number } = {
      name: "League",
    };
    expect(normalize_competition_event_edit_settings(form_data)).toBe(
      form_data,
    );
  });

  it("describes what officials can do for the chosen limit", () => {
    expect(build_max_event_edits_hint(0)).toBe(
      "Officials won't be able to edit or remove events.",
    );
    expect(build_max_event_edits_hint(1)).toBe(
      "Officials can make up to 1 edit per game.",
    );
    expect(build_max_event_edits_hint(5)).toBe(
      "Officials can make up to 5 edits per game.",
    );
    expect(build_max_event_edits_hint("")).toBe(
      "Officials can make up to 3 edits per game.",
    );
  });
});
