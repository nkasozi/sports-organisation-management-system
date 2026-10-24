import { describe, expect, it } from "vitest";

import { create_empty_sport_input } from "./Sport";
import { validate_sport_input } from "./SportFactories";

describe("validate_sport_input with missing lists", () => {
  it("reports missing periods and officials instead of crashing", () => {
    const input = {
      ...create_empty_sport_input(),
      name: "Basketball",
      code: "BB",
      periods: undefined,
      official_requirements: undefined,
    } as never;

    const errors = validate_sport_input(input);

    expect(errors).toContain("At least one game period is required");
    expect(errors).toContain(
      "At least one mandatory official role is required",
    );
  });
});
