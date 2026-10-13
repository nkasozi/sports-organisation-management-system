import { describe, expect, it } from "vitest";

import type { Competition } from "./Competition";
import type { Sport } from "./Sport";
import { resolve_sport_event_source } from "./SportEventSource";

const NETBALL = {
  code: "NETBALL",
  scoring_rules: [
    { event_type: "goal", points_awarded: 1, description: "" },
    { event_type: "super_shot", points_awarded: 2, description: "" },
  ],
  card_types: [{ id: "yellow_card", name: "Yellow Card" }],
} as unknown as Sport;

describe("resolve_sport_event_source", () => {
  it("uses the sport's scoring rules and cards", () => {
    const source = resolve_sport_event_source(NETBALL, void 0);

    expect(source.sport_code).toBe("NETBALL");
    expect(source.scoring_rules.map((rule) => rule.event_type)).toEqual([
      "goal",
      "super_shot",
    ]);
    expect(source.card_types.map((card) => card.id)).toEqual(["yellow_card"]);
  });

  it("lets a competition replace the scoring rules and add cards", () => {
    const competition = {
      rule_overrides: {
        scoring_rules: [
          { event_type: "goal", points_awarded: 1, description: "" },
        ],
        additional_card_types: [{ id: "blue_card", name: "Blue Card" }],
      },
    } as unknown as Competition;

    const source = resolve_sport_event_source(NETBALL, competition);

    expect(source.scoring_rules.map((rule) => rule.event_type)).toEqual([
      "goal",
    ]);
    expect(source.card_types.map((card) => card.id)).toEqual([
      "yellow_card",
      "blue_card",
    ]);
  });

  it("falls back to the default rules when the sport is unknown", () => {
    const source = resolve_sport_event_source(void 0, void 0);

    expect(source.scoring_rules.length).toBeGreaterThan(0);
    expect(source.card_types.length).toBeGreaterThan(0);
  });
});
