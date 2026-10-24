import { describe, expect, it } from "vitest";

import type { Sport } from "./Sport";
import {
  build_sport_event_types,
  build_sport_official_roles,
  build_sport_player_positions,
} from "./SportOrganizationDefaults";

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
      description: "Controls half the court",
    },
    {
      role_id: "scorer",
      role_name: "Scorer",
      minimum_count: 1,
      maximum_count: 2,
      is_mandatory: true,
      description: "Records goals",
    },
  ],
  scoring_rules: [
    { event_type: "goal", points_awarded: 1, description: "" },
    { event_type: "super_shot", points_awarded: 2, description: "" },
  ],
  card_types: [{ id: "yellow_card", name: "Yellow Card", color: "#FBBF24" }],
} as unknown as Sport;

const CUSTOM_SPORT = {
  ...NETBALL,
  id: "sport_kabaddi",
  name: "Kabaddi",
  code: "KABADDI",
} as unknown as Sport;

describe("build_sport_official_roles", () => {
  it("creates one role per official the sport requires", () => {
    const roles = build_sport_official_roles(NETBALL, "org_1");

    expect(roles.map((role) => role.name)).toEqual(["Umpire", "Scorer"]);
    expect(roles[0]).toMatchObject({
      code: "UMPIRE",
      description: "Controls half the court",
      sport_id: "sport_netball",
      organization_id: "org_1",
      is_head_official: true,
      display_order: 1,
    });
    expect(roles[1].is_head_official).toBe(false);
  });

  it("keeps table officials such as the scorer and timekeeper off the field", () => {
    const basketball = {
      ...NETBALL,
      official_requirements: [
        { ...NETBALL.official_requirements[0], role_id: "referee" },
        { ...NETBALL.official_requirements[1], role_id: "scorer" },
        {
          ...NETBALL.official_requirements[1],
          role_id: "timekeeper",
          role_name: "Timekeeper",
        },
        {
          ...NETBALL.official_requirements[1],
          role_id: "Shot Clock Operator",
          role_name: "Shot Clock Operator",
        },
      ],
    } as unknown as Sport;

    const roles = build_sport_official_roles(basketball, "org_1");

    expect(roles.map((role) => role.is_on_field)).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });
});

describe("build_sport_event_types", () => {
  it("creates the scoring, card and match events the sport uses", () => {
    const event_types = build_sport_event_types(NETBALL, "org_1");

    const super_shot = event_types.find((event) => event.code === "super_shot");
    expect(super_shot).toMatchObject({
      name: "Super Shot",
      category: "score",
      affects_score: true,
      sport_id: "sport_netball",
      organization_id: "org_1",
    });
    expect(event_types.map((event) => event.code)).not.toContain("offside");
    expect(
      event_types.find((event) => event.code === "yellow_card")?.category,
    ).toBe("discipline");
  });
});

describe("build_sport_player_positions", () => {
  it("uses the positions of a sport it knows", () => {
    const positions = build_sport_player_positions(NETBALL, "org_1");

    expect(positions.map((position) => position.code)).toEqual([
      "GS",
      "GA",
      "WA",
      "C",
      "WD",
      "GD",
      "GK",
    ]);
    expect(positions[0]).toMatchObject({
      sport_type: "Netball",
      organization_id: "org_1",
    });
  });

  it("gives other sports a general position so players can be added", () => {
    const positions = build_sport_player_positions(CUSTOM_SPORT, "org_1");

    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({
      name: "Player",
      sport_type: "Kabaddi",
    });
  });
});
