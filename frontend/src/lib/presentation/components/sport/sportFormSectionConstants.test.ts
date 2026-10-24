import { describe, expect, it } from "vitest";

import {
  build_substitution_limit_hint,
  is_penalty_based_overtime,
  SPORT_OVERTIME_TYPE,
  SPORT_SUBSTITUTION_LIMIT_TEXT,
} from "./sportFormSectionConstants";

describe("is_penalty_based_overtime", () => {
  it("is true for penalties and shootouts", () => {
    expect(is_penalty_based_overtime(SPORT_OVERTIME_TYPE.PENALTIES)).toBe(true);
    expect(is_penalty_based_overtime(SPORT_OVERTIME_TYPE.SHOOTOUT)).toBe(true);
  });

  it("is false for other overtime types", () => {
    expect(is_penalty_based_overtime(SPORT_OVERTIME_TYPE.EXTRA_TIME)).toBe(
      false,
    );
    expect(is_penalty_based_overtime(SPORT_OVERTIME_TYPE.GOLDEN_GOAL)).toBe(
      false,
    );
  });
});

describe("build_substitution_limit_hint", () => {
  it("explains that -1 means unlimited", () => {
    expect(build_substitution_limit_hint(5)).toBe(
      SPORT_SUBSTITUTION_LIMIT_TEXT.UNLIMITED_EXPLANATION,
    );
    expect(SPORT_SUBSTITUTION_LIMIT_TEXT.UNLIMITED_EXPLANATION).toBe(
      "-1 means unlimited",
    );
  });

  it("says the limit is currently unlimited when the value is -1", () => {
    expect(build_substitution_limit_hint(-1)).toBe(
      "Currently unlimited (-1 means unlimited)",
    );
    expect(build_substitution_limit_hint("-1")).toBe(
      "Currently unlimited (-1 means unlimited)",
    );
  });
});
