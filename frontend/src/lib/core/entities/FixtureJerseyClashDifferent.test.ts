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

    describe("different colors (Delta E >= 25)", () => {
      it("does not warn for clearly different colors", () => {
        const home_jersey = create_jersey_assignment("#DC2626", "Red");
        const away_jersey = create_jersey_assignment("#2563EB", "Blue");

        const warnings = detect_jersey_color_clashes(
          home_jersey,
          away_jersey,
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
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
          create_empty_jersey_assignment(),
          "Home Team",
          "Away Team",
        );

        expect(warnings.length).toBe(0);
      });
    });
  });
});
