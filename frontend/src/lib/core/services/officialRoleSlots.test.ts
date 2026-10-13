import { describe, expect, it } from "vitest";

import {
  assign_officials_to_slots,
  build_official_role_slots,
} from "./officialRoleSlots";

const NETBALL_ROLES = [
  { id: "role_umpire", name: "Umpire", code: "UMPIRE" },
  { id: "role_scorer", name: "Scorer", code: "SCORER" },
  { id: "role_timekeeper", name: "Timekeeper", code: "TIMEKEEPER" },
];

const NETBALL_REQUIREMENTS = [
  {
    role_id: "timekeeper",
    role_name: "Timekeeper",
    minimum_count: 0,
    is_mandatory: false,
  },
  {
    role_id: "umpire",
    role_name: "Umpire",
    minimum_count: 2,
    is_mandatory: true,
  },
  {
    role_id: "scorer",
    role_name: "Scorer",
    minimum_count: 1,
    is_mandatory: true,
  },
];

describe("build_official_role_slots", () => {
  it("fills the required officials first, as many as the sport needs", () => {
    const slots = build_official_role_slots(
      NETBALL_REQUIREMENTS,
      NETBALL_ROLES,
    );

    expect(slots.map((slot) => slot.id)).toEqual([
      "role_umpire",
      "role_umpire",
      "role_scorer",
    ]);
  });

  it("matches roles by code when the names differ", () => {
    const slots = build_official_role_slots(
      [
        {
          role_id: "umpire",
          role_name: "Court Umpire",
          minimum_count: 1,
          is_mandatory: true,
        },
      ],
      NETBALL_ROLES,
    );

    expect(slots.map((slot) => slot.id)).toEqual(["role_umpire"]);
  });

  it("keeps every role once when the sport's officials do not match any role", () => {
    const slots = build_official_role_slots(
      [
        {
          role_id: "referee",
          role_name: "Referee",
          minimum_count: 1,
          is_mandatory: true,
        },
      ],
      NETBALL_ROLES,
    );

    expect(slots).toEqual(NETBALL_ROLES);
  });
});

describe("assign_officials_to_slots", () => {
  it("gives each slot a different official", () => {
    expect(
      assign_officials_to_slots(
        [{ id: "o1" }, { id: "o2" }],
        [{ id: "role_umpire" }, { id: "role_umpire" }, { id: "role_scorer" }],
      ),
    ).toEqual([
      { official_id: "o1", role_id: "role_umpire" },
      { official_id: "o2", role_id: "role_umpire" },
    ]);
  });
});
