import { describe, expect, it } from "vitest";

import type { CardTypeSource, ScoringRuleSource } from "./SportEventCatalog";
import {
  build_sport_event_buttons,
  create_score_award_resolver,
  NO_SCORE_AWARD,
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
} from "./SportEventCatalog";

const NETBALL_SCORING: ScoringRuleSource[] = [
  { event_type: "goal", points_awarded: 1 },
  { event_type: "super_shot", points_awarded: 2 },
];

const BASKETBALL_SCORING: ScoringRuleSource[] = [
  { event_type: "field_goal_3pt", points_awarded: 3 },
  { event_type: "free_throw", points_awarded: 1 },
];

const CARDS: CardTypeSource[] = [{ id: "yellow_card", name: "Yellow Card" }];

describe("create_score_award_resolver", () => {
  it("awards the points the sport defines for the event", () => {
    const resolve = create_score_award_resolver(NETBALL_SCORING);

    expect(resolve("super_shot")).toEqual({
      kind: SCORE_AWARD_KIND.CREDIT,
      credited_side: SCORE_CREDITED_SIDE.ACTING,
      points: 2,
    });
  });

  it("credits an own goal to the opposing side", () => {
    const resolve = create_score_award_resolver([
      { event_type: "own_goal", points_awarded: 1 },
    ]);

    expect(resolve("own_goal")).toEqual({
      kind: SCORE_AWARD_KIND.CREDIT,
      credited_side: SCORE_CREDITED_SIDE.OPPOSING,
      points: 1,
    });
  });

  it("gives no score for events the sport does not score", () => {
    const resolve = create_score_award_resolver(BASKETBALL_SCORING);

    expect(resolve("foul")).toEqual(NO_SCORE_AWARD);
    expect(resolve("goal")).toEqual(NO_SCORE_AWARD);
  });

  it("keeps scoring older events recorded before the sport had rules", () => {
    const resolve = create_score_award_resolver([]);

    expect(resolve("goal")).toMatchObject({ points: 1 });
    expect(resolve("penalty_scored")).toMatchObject({ points: 1 });
  });
});

describe("build_sport_event_buttons", () => {
  it("offers the sport's scoring events with their points", () => {
    const buttons = build_sport_event_buttons({
      sport_code: "NETBALL",
      scoring_rules: NETBALL_SCORING,
      card_types: CARDS,
    });

    const super_shot = buttons.find((button) => button.id === "super_shot");
    expect(super_shot).toMatchObject({
      label: "Super Shot (+2)",
      affects_score: true,
    });
  });

  it("offers the sport's own cards and the common match events", () => {
    const ids = build_sport_event_buttons({
      sport_code: "NETBALL",
      scoring_rules: NETBALL_SCORING,
      card_types: CARDS,
    }).map((button) => button.id);

    expect(ids).toEqual([
      "goal",
      "super_shot",
      "yellow_card",
      "substitution",
      "foul",
      "injury",
    ]);
  });

  it("does not offer football-only events to other sports", () => {
    const ids = build_sport_event_buttons({
      sport_code: "BASKETBALL",
      scoring_rules: BASKETBALL_SCORING,
      card_types: [],
    }).map((button) => button.id);

    expect(ids).not.toContain("offside");
    expect(ids).not.toContain("var_review");
    expect(ids).toContain("field_goal_3pt");
  });

  it("keeps football's extra match events", () => {
    const ids = build_sport_event_buttons({
      sport_code: "FOOTBALL",
      scoring_rules: [{ event_type: "goal", points_awarded: 1 }],
      card_types: [],
    }).map((button) => button.id);

    expect(ids).toEqual(expect.arrayContaining(["offside", "corner"]));
  });
});
