import { describe, expect, it } from "vitest";

import { filter_official_roles_for_sport } from "./officialRolesForSport";

const WHEELCHAIR_BASKETBALL_ID = "sport_wheelchair_basketball";

const REQUIREMENTS = [
  { role_id: "referee", role_name: "Lead Referee" },
  { role_id: "umpire", role_name: "Umpire" },
  { role_id: "scorer", role_name: "Scorer" },
  { role_id: "timekeeper", role_name: "Timekeeper" },
];

function create_role(
  id: string,
  name: string,
  code: string,
  sport_id: string,
): { id: string; name: string; code: string; sport_id: string } {
  return { id, name, code, sport_id };
}

const ROLES = [
  create_role("lead", "Lead Referee", "REFEREE", WHEELCHAIR_BASKETBALL_ID),
  create_role("umpire", "Umpire", "UMPIRE", WHEELCHAIR_BASKETBALL_ID),
  create_role("football_referee", "Referee", "REF", ""),
  create_role("assistant", "Assistant Referee", "AR", ""),
  create_role("fourth", "Fourth Official", "4TH", ""),
  create_role("var", "VAR Official", "VAR", ""),
  create_role("generic_scorer", "Scorer", "SCORER", ""),
  create_role("hockey_umpire", "Umpire", "UMPIRE", "sport_hockey"),
];

describe("filter_official_roles_for_sport", () => {
  it("keeps the sport's own roles and generic roles the sport asks for", () => {
    const roles = filter_official_roles_for_sport({
      roles: ROLES,
      sport_id: WHEELCHAIR_BASKETBALL_ID,
      requirements: REQUIREMENTS,
    });

    expect(roles.map((role) => role.id)).toEqual([
      "lead",
      "umpire",
      "generic_scorer",
    ]);
  });

  it("drops football roles for a sport that does not use them", () => {
    const role_names = filter_official_roles_for_sport({
      roles: ROLES,
      sport_id: WHEELCHAIR_BASKETBALL_ID,
      requirements: REQUIREMENTS,
    }).map((role) => role.name);

    expect(role_names).not.toContain("Assistant Referee");
    expect(role_names).not.toContain("Fourth Official");
    expect(role_names).not.toContain("VAR Official");
    expect(role_names).not.toContain("Referee");
  });

  it("keeps every generic role when the organisation has no roles linked to the sport", () => {
    const generic_roles = ROLES.filter((role) => role.sport_id === "");

    const roles = filter_official_roles_for_sport({
      roles: generic_roles,
      sport_id: "sport_football",
      requirements: [{ role_id: "referee", role_name: "Main Referee" }],
    });

    expect(roles).toEqual(generic_roles);
  });

  it("keeps generic football roles for football, which lists them as requirements", () => {
    const roles = filter_official_roles_for_sport({
      roles: [
        ...ROLES,
        create_role("football_var", "VAR", "VAR_OFFICIAL", "sport_football"),
      ],
      sport_id: "sport_football",
      requirements: [
        { role_id: "referee", role_name: "Referee" },
        { role_id: "assistant_referee", role_name: "Assistant Referee" },
      ],
    });

    expect(roles.map((role) => role.id)).toEqual([
      "football_referee",
      "assistant",
      "football_var",
    ]);
  });

  it("returns no roles when only other sports have roles", () => {
    expect(
      filter_official_roles_for_sport({
        roles: ROLES.filter((role) => role.sport_id !== ""),
        sport_id: "sport_cricket",
        requirements: [],
      }),
    ).toEqual([]);
  });
});
