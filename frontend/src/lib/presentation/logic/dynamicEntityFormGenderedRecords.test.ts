import { describe, expect, it } from "vitest";

import {
  pair_gender_ids,
  read_text_field,
  to_gendered_player,
  to_gendered_team,
} from "./dynamicEntityFormGenderedRecords";

describe("dynamicEntityFormGenderedRecords", () => {
  it("reads only string fields from object records", () => {
    expect(read_text_field({ name: "Lions" }, "name")).toBe("Lions");
    expect(read_text_field({ name: 7 }, "name")).toBe("");
    expect(read_text_field("not-a-record", "name")).toBe("");
  });

  it("builds a player display name and gender option", () => {
    expect(
      to_gendered_player({
        gender_id: "gender-f",
        first_name: "Ada",
        last_name: "Moss",
      }),
    ).toEqual({
      gender: { status: "some", value: "gender-f" },
      display_name: "Ada Moss",
    });
    expect(to_gendered_player({})).toEqual({
      gender: { status: "none" },
      display_name: "",
    });
  });

  it("falls back to the team id when the team has no name", () => {
    expect(to_gendered_team({ gender_id: "gender-m" }, "team-1")).toEqual({
      gender: { status: "some", value: "gender-m" },
      display_name: "team-1",
    });
  });

  it("pairs gender ids only when both records have a gender", () => {
    const female_team = to_gendered_team({ gender_id: "gender-f" }, "team-1");
    const unknown_team = to_gendered_team({}, "team-2");

    expect(pair_gender_ids(female_team, female_team)).toEqual({
      status: "present",
      first_gender_id: "gender-f",
      second_gender_id: "gender-f",
    });
    expect(pair_gender_ids(female_team, unknown_team)).toEqual({
      status: "missing",
    });
    expect(pair_gender_ids(unknown_team, female_team)).toEqual({
      status: "missing",
    });
  });
});
