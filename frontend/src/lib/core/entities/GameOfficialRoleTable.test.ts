import { describe, expect, it } from "vitest";

import {
  build_table_official_role_input,
  find_table_official_role_ids,
  is_table_official_role,
} from "./GameOfficialRoleTable";

describe("table official roles", () => {
  it("uses the role's own flag when it has one", () => {
    expect(
      is_table_official_role({ code: "REF", is_table_official: true }),
    ).toBe(true);
    expect(
      is_table_official_role({ code: "TO", is_table_official: false }),
    ).toBe(false);
  });

  it("recognises table roles saved before the flag existed by their code", () => {
    expect(is_table_official_role({ code: "TO" })).toBe(true);
    expect(is_table_official_role({ code: "scorer" })).toBe(true);
    expect(is_table_official_role({ code: "UMP1" })).toBe(false);
  });

  it("lists the ids of every table official role", () => {
    expect(
      find_table_official_role_ids([
        { id: "r1", code: "UMP1", is_table_official: false },
        { id: "r2", code: "TO", is_table_official: true },
        { id: "r3", code: "TIMEKEEPER" },
      ]),
    ).toEqual(new Set(["r2", "r3"]));
  });

  it("builds a default table official role for sports that have none", () => {
    expect(
      build_table_official_role_input("org_1", "sport_1", 3),
    ).toMatchObject({
      name: "Table Official",
      code: "TABLE_OFFICIAL",
      is_table_official: true,
      is_on_field: false,
      is_head_official: false,
      display_order: 3,
      sport_id: "sport_1",
      organization_id: "org_1",
    });
  });
});
