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

    describe("edge cases", () => {
      it("handles empty home jersey", () => {
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
      });

      it("handles empty away jersey", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Home Red");
        const official_jersey = create_jersey_assignment(
          "#DC2626",
          "Official Red",
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
      });

      it("handles empty official jersey", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Home Red");
        const away_jersey = create_jersey_assignment("#DC2626", "Away Red");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          create_empty_jersey_assignment(),
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
      });

      it("handles all empty jerseys", () => {
        const warnings = detect_jersey_color_clashes(
          create_empty_jersey_assignment(),
          create_empty_jersey_assignment(),
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(1);
        expect(warnings[0].delta_e).toBe(0);
      });

      it("handles hex codes without # prefix", () => {
        const home_jersey = {
          jersey_color_id: "jersey_1",
          nickname: "Black",
          main_color: "1F2937",
        } as ScalarInput<JerseyColorAssignment>;
        const away_jersey = {
          jersey_color_id: "jersey_2",
          nickname: "Black",
          main_color: "1F2937",
        } as ScalarInput<JerseyColorAssignment>;

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
});
