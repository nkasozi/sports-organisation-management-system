import { describe, expect, it } from "vitest";

import type { Sport } from "$lib/core/entities/Sport";
import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  select_event_types_for_organization,
  select_official_roles_for_organization,
  select_player_positions_for_organization,
} from "./organizationDefaultsSportData";

const NETBALL = {
  id: "sport_netball",
  name: "Netball",
  code: "NETBALL",
  official_requirements: [
    {
      role_id: "umpire",
      role_name: "Umpire",
      minimum_count: 2,
      maximum_count: 2,
      is_mandatory: true,
      description: "",
    },
  ],
  scoring_rules: [{ event_type: "super_shot", points_awarded: 2 }],
  card_types: [],
} as unknown as Sport;

const FIELD_HOCKEY = {
  ...NETBALL,
  name: "Field Hockey",
  code: "Field Hockey",
} as unknown as Sport;

describe("organization defaults for a sport", () => {
  it("seeds the officials the sport requires", () => {
    const roles = select_official_roles_for_organization(
      "org_1",
      create_some_option(NETBALL),
    );

    expect(roles.map((role) => role.name)).toEqual(["Umpire"]);
    expect(roles[0].id).toBe("role_sport_1_org_1");
  });

  it("keeps the standard officials when the sport is unknown", () => {
    const roles = select_official_roles_for_organization(
      "org_1",
      create_none_option(),
    );

    expect(roles.map((role) => role.name)).toContain("Referee");
  });

  it("seeds the sport's own event types", () => {
    const codes = select_event_types_for_organization(
      "org_1",
      create_some_option(NETBALL),
    ).map((event_type) => event_type.code);

    expect(codes).toContain("super_shot");
    expect(codes).not.toContain("offside");
  });

  it("keeps the full hockey position list for field hockey", () => {
    const positions = select_player_positions_for_organization(
      "org_1",
      create_some_option(FIELD_HOCKEY),
    );

    expect(positions.map((position) => position.code)).toContain("GK");
    expect(positions.length).toBeGreaterThan(10);
  });

  it("seeds netball positions for a netball organisation", () => {
    const positions = select_player_positions_for_organization(
      "org_1",
      create_some_option(NETBALL),
    );

    expect(positions.map((position) => position.code)).toEqual([
      "GS",
      "GA",
      "WA",
      "C",
      "WD",
      "GD",
      "GK",
    ]);
  });
});
