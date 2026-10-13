import { describe, expect, it } from "vitest";

import {
  create_empty_rating_input,
  type CreateOfficialPerformanceRatingInput,
  validate_rating_input,
} from "./OfficialPerformanceRating";

describe("validate_rating_input", () => {
  function valid_input(): CreateOfficialPerformanceRatingInput {
    return create_empty_rating_input("org_1", "off_1", "fix_1");
  }

  it("passes for a fully valid input", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
    });
    expect(errors).toHaveLength(0);
  });

  it("requires official_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      official_id: "",
    });
    expect(errors).toContain("Official is required");
  });

  it("requires fixture_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      fixture_id: "",
    });
    expect(errors).toContain("Fixture is required");
  });

  it("requires rater_user_id", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "",
    });
    expect(errors).toContain("Rater user is required");
  });

  it("rejects dimension below 1", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      overall: 0,
    });
    expect(errors.some((e) => e.includes("overall"))).toBe(true);
  });

  it("rejects dimension above 10", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      fitness: 11,
    });
    expect(errors.some((e) => e.includes("fitness"))).toBe(true);
  });

  it("rejects non-number dimension", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      rater_user_id: "user_1",
      decision_accuracy: NaN,
    });
    expect(errors.some((e) => e.includes("decision_accuracy"))).toBe(true);
  });

  it("collects multiple errors at once", () => {
    const errors = validate_rating_input({
      ...valid_input(),
      official_id: "",
      fixture_id: "",
      rater_user_id: "",
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
