import { describe, expect, it } from "vitest";

import { get_display_value_for_entity_field } from "./listDisplayValueLogic";

function display(field_name: string, value: unknown): string {
  return get_display_value_for_entity_field(
    { id: "record_1", [field_name]: value } as never,
    field_name,
    {},
  );
}

describe("list display of numbers", () => {
  it("adds thousands separators to large counts like venue capacity", () => {
    expect(display("capacity", 40000)).toBe("40,000");
    expect(display("max_teams", 1500)).toBe("1,500");
    expect(display("weight_kg", 72.5)).toBe("72.5");
  });

  it("leaves small numbers unchanged", () => {
    expect(display("capacity", 500)).toBe("500");
    expect(display("home_team_score", 0)).toBe("0");
  });

  it("does not format years, jersey numbers, codes or ordering values", () => {
    expect(display("founded_year", 1995)).toBe("1995");
    expect(display("year", 2026)).toBe("2026");
    expect(display("jersey_number", 1234)).toBe("1234");
    expect(display("display_order", 1000)).toBe("1000");
    expect(display("postal_code", 25600)).toBe("25600");
  });

  it("does not touch numbers stored as text", () => {
    expect(display("phone", "0772000000")).toBe("0772000000");
  });
});
