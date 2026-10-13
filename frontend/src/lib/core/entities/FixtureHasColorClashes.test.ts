import { describe, expect, it } from "vitest";

import type { ScalarInput } from "../types/DomainScalars";
import {
  create_empty_jersey_assignment,
  has_color_clashes,
  type JerseyColorAssignment,
} from "./Fixture";

describe("Fixture Jersey Color Clash Detection", () => {
  describe("has_color_clashes", () => {
    const create_jersey_assignment = (
      color: string,
    ): ScalarInput<JerseyColorAssignment> => ({
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
        create_empty_jersey_assignment(),
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
        create_empty_jersey_assignment(),
        "Home Team",
        "Away Team",
      );

      expect(result).toBe(false);
    });
  });
});
