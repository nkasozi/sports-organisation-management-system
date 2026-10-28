import { describe, expect, it } from "vitest";

import { omit_blank_optional_numbers } from "./blank_number_fields";

describe("omit_blank_optional_numbers", () => {
  it("treats a number left blank in a form as not set", () => {
    expect(
      omit_blank_optional_numbers("competition_teams", {
        competition_id: "comp_1",
        team_id: "team_1",
        seed_number: "",
      }),
    ).toEqual({ competition_id: "comp_1", team_id: "team_1" });
    expect(
      omit_blank_optional_numbers("teams", {
        name: "E2E Lions",
        founded_year: "",
      }),
    ).toEqual({ name: "E2E Lions" });
  });

  it("keeps blank text and real numbers as they are", () => {
    expect(
      omit_blank_optional_numbers("teams", {
        name: "E2E Lions",
        description: "",
        founded_year: 1999,
        max_squad_size: 0,
      }),
    ).toEqual({
      name: "E2E Lions",
      description: "",
      founded_year: 1999,
      max_squad_size: 0,
    });
  });
});
