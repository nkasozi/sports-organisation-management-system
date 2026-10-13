import { describe, expect, it } from "vitest";

import type { ScalarInput } from "../types/DomainScalars";
import {
  detect_jersey_color_clashes,
  type JerseyColorAssignment,
} from "./Fixture";
import { create_jersey_assignment } from "./FixtureJerseyColors.test_support";

describe("Fixture Jersey Color Clash Detection", () => {
  describe("detect_jersey_color_clashes", () => {
    const create_empty_jersey_assignment =
      (): ScalarInput<JerseyColorAssignment> => ({
        jersey_color_id: "",
        nickname: "",
        main_color: "",
      });

    describe("identical colors (Delta E = 0)", () => {
      it("detects identical black jerseys between home and away teams", () => {
        const home_jersey = create_jersey_assignment("#1F2937", "Home Black");
        const away_jersey = create_jersey_assignment("#1F2937", "Away Black");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].delta_e).toBeLessThan(25);
      });
    });
  });
});
