import { describe, expect, it } from "vitest";

import { pick_fake_competition_team_ids } from "./competitionCreateFakeTeams";

const MEN = ["m1", "m2", "m3", "m4", "m5"].map((id) => ({
  id,
  gender_id: "male",
}));
const WOMEN = ["w1", "w2", "w3"].map((id) => ({ id, gender_id: "female" }));

describe("fake competitions pick teams that belong together", () => {
  it("picks four teams of one gender", () => {
    for (let round = 0; round < 20; round += 1) {
      const ids = pick_fake_competition_team_ids([...MEN, ...WOMEN]);
      expect(ids).toHaveLength(4);
      expect(ids.every((id) => id.startsWith("m"))).toBe(true);
      expect(new Set(ids).size).toBe(4);
    }
  });

  it("uses a smaller group when no group has four teams", () => {
    const ids = pick_fake_competition_team_ids(WOMEN);
    expect([...ids].sort()).toEqual(["w1", "w2", "w3"]);
  });

  it("picks nothing when there are fewer than two teams", () => {
    expect(pick_fake_competition_team_ids([MEN[0]])).toEqual([]);
  });
});
