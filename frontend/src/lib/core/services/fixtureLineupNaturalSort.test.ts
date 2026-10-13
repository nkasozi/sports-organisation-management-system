import { describe, expect, it } from "vitest";

import { compare_lineup_player_names } from "./fixtureLineupNameOrder";

describe("compare_lineup_player_names", () => {
  it("orders numbered names naturally", () => {
    const names = ["Falcon10", "Falcon2", "Falcon1", "Falcon11"].map(
      (last_name) => ({ first_name: "A", last_name }),
    );

    expect(
      [...names].sort(compare_lineup_player_names).map((p) => p.last_name),
    ).toEqual(["Falcon1", "Falcon2", "Falcon10", "Falcon11"]);
  });

  it("ignores letter case", () => {
    expect(
      compare_lineup_player_names(
        { first_name: "a", last_name: "okello" },
        { first_name: "A", last_name: "Okello" },
      ),
    ).toBe(0);
  });
});
