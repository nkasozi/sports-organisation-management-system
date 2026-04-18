import { describe, expect, it } from "vitest";

import {
  compute_importance_weight,
  type ImportanceWeightInput,
} from "./compute_importance_weight";

function make_input(
  overrides: Partial<ImportanceWeightInput> = {},
): ImportanceWeightInput {
  return {
    stage_type: "league_stage",
    match_day: 1,
    total_match_days: 10,
    manual_override: { status: "automatic" },
    ...overrides,
  } as ImportanceWeightInput;
}

describe("compute_importance_weight", () => {
  describe("manual_override", () => {
    it("returns manual_override when set, regardless of stage_type", () => {
      const result = compute_importance_weight(
        make_input({
          stage_type: "one_off_stage",
          manual_override: { status: "manual", value: 1.5 },
        }),
      );
      expect(result).toBe(1.5);
    });

    it("uses computed weight when manual_override is automatic", () => {
      const result = compute_importance_weight(
        make_input({
          stage_type: "one_off_stage",
          manual_override: { status: "automatic" },
        }),
      );
      expect(result).toBe(3.0);
    });
  });

  describe("one_off_stage", () => {
    it("always returns 3.0", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "one_off_stage",
            match_day: 1,
            total_match_days: 1,
          }),
        ),
      ).toBe(3.0);
    });
  });

  describe("knockout_stage", () => {
    it("returns 2.5 for non-final rounds", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "knockout_stage",
            match_day: 1,
            total_match_days: 4,
          }),
        ),
      ).toBe(2.5);
    });

    it("returns 3.0 for final round", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "knockout_stage",
            match_day: 4,
            total_match_days: 4,
          }),
        ),
      ).toBe(3.0);
    });

    it("returns 3.0 when match_day exceeds total_match_days", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "knockout_stage",
            match_day: 5,
            total_match_days: 4,
          }),
        ),
      ).toBe(3.0);
    });
  });

  describe("league_stage", () => {
    it("returns 1.5 for early matches", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "league_stage",
            match_day: 1,
            total_match_days: 10,
          }),
        ),
      ).toBe(1.5);
    });

    it("returns 2.0 for late season matches (last 2 days)", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "league_stage",
            match_day: 8,
            total_match_days: 10,
          }),
        ),
      ).toBe(2.0);
    });

    it("returns 3.0 for final match day", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "league_stage",
            match_day: 10,
            total_match_days: 10,
          }),
        ),
      ).toBe(3.0);
    });

    it("returns default weight when total_match_days is zero", () => {
      const result = compute_importance_weight(
        make_input({
          stage_type: "league_stage",
          match_day: 1,
          total_match_days: 0,
        }),
      );
      expect(result).toBe(1.5);
    });
  });

  describe("group_stage", () => {
    it("returns 1.5 for early matches", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "group_stage",
            match_day: 1,
            total_match_days: 6,
          }),
        ),
      ).toBe(1.5);
    });

    it("returns 2.0 for late matches", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "group_stage",
            match_day: 4,
            total_match_days: 6,
          }),
        ),
      ).toBe(2.0);
    });

    it("returns 3.0 for final match day", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "group_stage",
            match_day: 6,
            total_match_days: 6,
          }),
        ),
      ).toBe(3.0);
    });
  });

  describe("unknown stage type", () => {
    it("returns 1.0 for custom or unrecognised stage types", () => {
      expect(
        compute_importance_weight(
          make_input({
            stage_type: "custom" as never,
            match_day: 5,
            total_match_days: 10,
          }),
        ),
      ).toBe(1.0);
    });
  });
});
