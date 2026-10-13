import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { Sport } from "$lib/core/entities/Sport";

import { build_match_report_sport_rules } from "./matchReportSportRules";

const NETBALL = {
  code: "NETBALL",
  periods: [
    {
      id: "q1",
      name: "1st Quarter",
      duration_minutes: 15,
      is_break: false,
      order: 1,
    },
  ],
  scoring_rules: [{ event_type: "super_shot", points_awarded: 2 }],
  card_types: [{ id: "yellow_card", name: "Yellow Card", color: "#FBBF24" }],
} as unknown as Sport;

describe("build_match_report_sport_rules", () => {
  it("matches cards to the events recorded with the card's id", () => {
    const rules = build_match_report_sport_rules(NETBALL, void 0);

    expect(rules.card_types).toEqual([
      {
        id: "yellow_card",
        name: "Yellow Card",
        color: "#FBBF24",
        event_type: "yellow_card",
      },
    ]);
  });

  it("uses the competition's periods over the sport's", () => {
    const competition = {
      rule_overrides: {
        periods: [
          {
            id: "q1",
            name: "1st Quarter",
            duration_minutes: 10,
            is_break: false,
            order: 1,
          },
        ],
      },
    } as unknown as Competition;

    const rules = build_match_report_sport_rules(NETBALL, competition);

    expect(rules.periods[0].duration_minutes).toBe(10);
    expect(rules.event_source.sport_code).toBe("NETBALL");
  });

  it("falls back to the default cards when the sport is unknown", () => {
    const rules = build_match_report_sport_rules(void 0, void 0);

    expect(rules.card_types.map((card) => card.event_type)).toContain(
      "yellow_card",
    );
  });
});
