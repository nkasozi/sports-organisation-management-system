import { describe, expect, it } from "vitest";

import {
  SPORT_CARD_SEVERITY_OPTIONS,
  SPORT_FORM_SECTIONS,
  SPORT_FOUL_SEVERITY_OPTIONS,
  SPORT_OVERTIME_TRIGGER_OPTIONS,
  SPORT_OVERTIME_TYPE_OPTIONS,
  SPORT_STATUS_OPTIONS,
} from "./sportFormEditorConstants";

describe("sportFormEditorConstants", () => {
  it("defines the editor sections in the expected order", () => {
    expect(SPORT_FORM_SECTIONS.map((section) => section.id)).toEqual([
      "basic",
      "periods",
      "cards",
      "fouls",
      "officials",
      "scoring",
      "overtime",
      "substitutions",
    ]);
  });

  it("exposes stable option lists for status, cards, fouls, and overtime", () => {
    expect(SPORT_STATUS_OPTIONS).toEqual([
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]);
    expect(SPORT_CARD_SEVERITY_OPTIONS.map((option) => option.value)).toEqual([
      "warning",
      "ejection",
      "suspension",
    ]);
    expect(SPORT_FOUL_SEVERITY_OPTIONS.map((option) => option.value)).toEqual([
      "minor",
      "moderate",
      "major",
      "severe",
    ]);
    expect(
      SPORT_OVERTIME_TRIGGER_OPTIONS.map((option) => option.value),
    ).toEqual(["draw", "knockout_draw", "never"]);
    expect(SPORT_OVERTIME_TYPE_OPTIONS.map((option) => option.value)).toContain(
      "penalties",
    );
  });
});
