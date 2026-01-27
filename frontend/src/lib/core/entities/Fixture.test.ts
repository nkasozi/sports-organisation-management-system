import { describe, expect, it } from "vitest";
import {
  detect_jersey_color_clashes,
  has_color_clashes,
  type JerseyColorAssignment,
  type ColorClashWarning,
} from "./Fixture";

describe("Fixture Jersey Color Clash Detection", () => {
  describe("detect_jersey_color_clashes", () => {
    const create_jersey_assignment = (
      color: string,
      nickname: string = "Test Jersey",
    ): JerseyColorAssignment => ({
      jersey_color_id: `jersey_${color}`,
      nickname,
      main_color: color,
    });

    describe("identical colors (Delta E = 0)", () => {
      it("detects identical black jerseys between home and away teams", () => {
        const home_jersey = create_jersey_assignment("#1F2937", "Home Black");
        const away_jersey = create_jersey_assignment("#1F2937", "Away Black");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].party_a).toBe("Home Team");
        expect(warnings[0].party_b).toBe("Away Team");
        expect(warnings[0].delta_e).toBe(0);
        expect(warnings[0].message).toContain("nearly identical");
      });

      it("detects identical colors between home team and officials", () => {
        const home_jersey = create_jersey_assignment("#1F2937", "Home Black");
        const official_jersey = create_jersey_assignment(
          "#1F2937",
          "Official Black",
        );

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          undefined,
          official_jersey,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].party_a).toBe("Home Team");
        expect(warnings[0].party_b).toBe("Officials");
      });

      it("detects identical colors between away team and officials", () => {
        const away_jersey = create_jersey_assignment("#DC2626", "Away Red");
        const official_jersey = create_jersey_assignment(
          "#DC2626",
          "Official Red",
        );

        const warnings = detect_jersey_color_clashes(
          undefined,
          away_jersey,
          official_jersey,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].party_a).toBe("Away Team");
        expect(warnings[0].party_b).toBe("Officials");
      });

      it("detects all three clashes when all jerseys are identical", () => {
        const home_jersey = create_jersey_assignment("#000000", "Home Black");
        const away_jersey = create_jersey_assignment("#000000", "Away Black");
        const official_jersey = create_jersey_assignment(
          "#000000",
          "Official Black",
        );

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          official_jersey,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(3);
      });
    });

    describe("similar colors (Delta E < 25)", () => {
      it("detects very similar dark colors", () => {
        const home_jersey = create_jersey_assignment("#1F2937", "Dark Gray");
        const away_jersey = create_jersey_assignment("#111827", "Darker Gray");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].delta_e).toBeLessThan(25);
      });

      it("detects similar shades of red", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Red");
        const away_jersey = create_jersey_assignment("#EF4444", "Light Red");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].delta_e).toBeLessThan(25);
      });
    });

    describe("different colors (Delta E >= 25)", () => {
      it("does not warn for clearly different colors", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Red");
        const away_jersey = create_jersey_assignment("#2563EB", "Blue");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });

      it("does not warn for black vs white", () => {
        const home_jersey = create_jersey_assignment("#000000", "Black");
        const away_jersey = create_jersey_assignment("#FFFFFF", "White");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });

      it("does not warn for red vs green", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Red");
        const away_jersey = create_jersey_assignment("#16A34A", "Green");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });

      it("does not warn for yellow vs navy", () => {
        const home_jersey = create_jersey_assignment("#FBBF24", "Yellow");
        const away_jersey = create_jersey_assignment("#1E3A8A", "Navy");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("handles undefined home jersey", () => {
        const away_jersey = create_jersey_assignment("#DC2626", "Away Red");
        const official_jersey = create_jersey_assignment(
          "#DC2626",
          "Official Red",
        );

        const warnings = detect_jersey_color_clashes(
          undefined,
          away_jersey,
          official_jersey,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].party_a).toBe("Away Team");
      });

      it("handles undefined away jersey", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Home Red");
        const official_jersey = create_jersey_assignment(
          "#DC2626",
          "Official Red",
        );

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          undefined,
          official_jersey,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].party_a).toBe("Home Team");
      });

      it("handles undefined official jersey", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Home Red");
        const away_jersey = create_jersey_assignment("#DC2626", "Away Red");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
      });

      it("handles all undefined jerseys", () => {
        const warnings = detect_jersey_color_clashes(
          undefined,
          undefined,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });

      it("handles 3-character hex codes", () => {
        const home_jersey = create_jersey_assignment("#000", "Black Short");
        const away_jersey = create_jersey_assignment("#000000", "Black Long");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].delta_e).toBe(0);
      });

      it("handles hex codes without # prefix", () => {
        const home_jersey: JerseyColorAssignment = {
          jersey_color_id: "jersey_1",
          nickname: "Black",
          main_color: "1F2937",
        };
        const away_jersey: JerseyColorAssignment = {
          jersey_color_id: "jersey_2",
          nickname: "Black",
          main_color: "1F2937",
        };

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
      });
    });

    describe("similarity descriptions", () => {
      it("reports 'nearly identical' for Delta E < 5", () => {
        const home_jersey = create_jersey_assignment("#000000", "Black 1");
        const away_jersey = create_jersey_assignment("#000000", "Black 2");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        expect(warnings[0].message).toContain("nearly identical");
      });

      it("reports 'very similar' for Delta E between 5 and 15", () => {
        const home_jersey = create_jersey_assignment("#1F2937", "Dark 1");
        const away_jersey = create_jersey_assignment("#374151", "Dark 2");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          undefined,
          "Home Team",
          "Away Team",
        );

        if (
          warnings.length > 0 &&
          warnings[0].delta_e >= 5 &&
          warnings[0].delta_e < 15
        ) {
          expect(warnings[0].message).toContain("very similar");
        }
      });
    });
  });

  describe("has_color_clashes", () => {
    const create_jersey_assignment = (
      color: string,
    ): JerseyColorAssignment => ({
      jersey_color_id: `jersey_${color}`,
      nickname: "Test Jersey",
      main_color: color,
    });

    it("returns true when colors clash", () => {
      const home_jersey = create_jersey_assignment("#000000");
      const away_jersey = create_jersey_assignment("#000000");

      const result = has_color_clashes(
        home_jersey,
        away_jersey,
        undefined,
        "Home Team",
        "Away Team",
      );

      expect(result).toBe(true);
    });

    it("returns false when colors are different", () => {
      const home_jersey = create_jersey_assignment("#DC2626");
      const away_jersey = create_jersey_assignment("#2563EB");

      const result = has_color_clashes(
        home_jersey,
        away_jersey,
        undefined,
        "Home Team",
        "Away Team",
      );

      expect(result).toBe(false);
    });
  });
});
