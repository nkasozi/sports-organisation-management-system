import { describe, expect, it } from "vitest";
import { create_empty_player_input, validate_player_input } from "./Player";

describe("Player", () => {
  it("requires first_name, last_name, date_of_birth, nationality, position_id", () => {
    const input = create_empty_player_input();
    const errors = validate_player_input(input);

    expect(errors).toContain("First name is required");
    expect(errors).toContain("Last name is required");
    expect(errors).toContain("Date of birth is required");
    expect(errors).toContain("Nationality is required");
    expect(errors).toContain("Position is required");
  });

  it("accepts jersey number rules through membership, not Player", () => {
    const errors = validate_player_input({
      ...create_empty_player_input(),
      first_name: "Ada",
      last_name: "Lovelace",
      date_of_birth: "1995-01-01",
      nationality: "Uganda",
      position_id: "playerposition_default_1",
    });

    expect(errors.length).toBe(0);
  });
});
