import { describe, expect, it } from "vitest";

import {
  create_empty_sport_input,
  validate_sport_input,
} from "./SportFactories";
import type { CreateSportInput } from "./SportTypes";

function create_netball_input(): CreateSportInput {
  return {
    ...create_empty_sport_input(),
    name: "Netball",
    code: "NETBALL",
    max_players_on_field: 7,
    min_players_on_field: 5,
    max_squad_size: 12,
    min_players_per_fixture: 7,
    max_players_per_fixture: 12,
  };
}

describe("validate_sport_input lineup limits", () => {
  it("accepts lineup limits that fit the squad", () => {
    expect(validate_sport_input(create_netball_input())).toEqual([]);
  });

  it("rejects a lineup larger than the squad", () => {
    expect(
      validate_sport_input({
        ...create_netball_input(),
        max_players_per_fixture: 18,
      }),
    ).toContain("Maximum players per fixture must be <= maximum squad size");
  });

  it("rejects a lineup smaller than the players needed on the field", () => {
    expect(
      validate_sport_input({
        ...create_netball_input(),
        min_players_per_fixture: 4,
      }),
    ).toContain(
      "Minimum players per fixture must be >= minimum players on field",
    );
  });

  it("rejects a lineup maximum below its minimum", () => {
    expect(
      validate_sport_input({
        ...create_netball_input(),
        min_players_per_fixture: 10,
        max_players_per_fixture: 8,
      }),
    ).toContain(
      "Maximum players per fixture must be >= minimum players per fixture",
    );
  });
});
