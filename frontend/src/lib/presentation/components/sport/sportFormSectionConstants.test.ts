import { describe, expect, it } from "vitest";

import {
  is_penalty_based_overtime,
  SPORT_OVERTIME_TYPE,
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
