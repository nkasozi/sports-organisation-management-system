import { describe, it, expect } from "vitest";
import {
  check_player_team_gender_mismatch,
  type GenderMismatchInput,
} from "./genderMismatchCheck";

function create_mismatch_input(
  overrides: Partial<GenderMismatchInput> = {},
): GenderMismatchInput {
  return {
    player_gender_id: "gender_default_male",
    team_gender_id: "gender_default_male",
    player_display_name: "John Doe",
    team_display_name: "Rockets HC",
    gender_name_map: new Map([
      ["gender_default_male", "Male"],
      ["gender_default_female", "Female"],
    ]),
    ...overrides,
  };
}

describe("check_player_team_gender_mismatch", () => {
  it("returns empty array when player and team genders match", () => {
    const input = create_mismatch_input({
      player_gender_id: "gender_default_male",
      team_gender_id: "gender_default_male",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toEqual([]);
  });

  it("returns warning when male player assigned to female team", () => {
    const input = create_mismatch_input({
      player_gender_id: "gender_default_male",
      team_gender_id: "gender_default_female",
      player_display_name: "James Okello",
      team_display_name: "Weatherhead Ladies",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("James Okello");
    expect(warnings[0]).toContain("Male");
    expect(warnings[0]).toContain("Weatherhead Ladies");
    expect(warnings[0]).toContain("Female");
  });

  it("returns warning when female player assigned to male team", () => {
    const input = create_mismatch_input({
      player_gender_id: "gender_default_female",
      team_gender_id: "gender_default_male",
      player_display_name: "Sarah Namuli",
      team_display_name: "Rockets HC",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Sarah Namuli");
    expect(warnings[0]).toContain("Female");
    expect(warnings[0]).toContain("Rockets HC");
    expect(warnings[0]).toContain("Male");
  });

  it("returns empty array when team has no gender set", () => {
    const input = create_mismatch_input({
      player_gender_id: "gender_default_male",
      team_gender_id: "",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toEqual([]);
  });

  it("returns empty array when player has no gender set", () => {
    const input = create_mismatch_input({
      player_gender_id: "",
      team_gender_id: "gender_default_female",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toEqual([]);
  });

  it("returns empty array when both genders are empty", () => {
    const input = create_mismatch_input({
      player_gender_id: "",
      team_gender_id: "",
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toEqual([]);
  });

  it("uses raw gender ids in warning when gender names not in map", () => {
    const input = create_mismatch_input({
      player_gender_id: "gender_custom_1",
      team_gender_id: "gender_custom_2",
      gender_name_map: new Map(),
    });

    const warnings = check_player_team_gender_mismatch(input);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("gender_custom_1");
    expect(warnings[0]).toContain("gender_custom_2");
  });
});
