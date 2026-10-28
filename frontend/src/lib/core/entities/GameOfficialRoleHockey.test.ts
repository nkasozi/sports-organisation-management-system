import { describe, expect, it } from "vitest";

import { build_official_role_slots } from "../services/officialRoleSlots";
import { get_default_football_official_roles_with_ids } from "./GameOfficialRole";
import { FIELD_HOCKEY_OFFICIAL_REQUIREMENTS } from "./SportFieldHockeyPresetConfig";

describe("default official roles cover field hockey", () => {
  it("fills a hockey match with a table official and umpires, not football referees", () => {
    const roles = get_default_football_official_roles_with_ids(
      "org_1" as never,
    ).map((role) => ({
      ...role,
      id: String(role.id),
      name: String(role.name),
    }));
    const slots = build_official_role_slots(
      FIELD_HOCKEY_OFFICIAL_REQUIREMENTS,
      roles,
    );
    expect(slots.map((slot) => slot.name)).toEqual([
      "Technical Officer",
      "Main Umpire",
      "Second Umpire",
    ]);
  });

  it("keeps the existing role ids stable", () => {
    const [first] = get_default_football_official_roles_with_ids(
      "org_1" as never,
    );
    expect(first.id).toBe("role_default_1_org_1");
    expect(first.name).toBe("Referee");
  });
});
