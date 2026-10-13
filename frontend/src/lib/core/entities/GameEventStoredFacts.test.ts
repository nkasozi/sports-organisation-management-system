import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "../types/Option";
import type { GameEvent } from "./FixtureTypes";
import {
  read_event_period_id,
  read_event_player_id,
  read_event_points_awarded,
  read_event_secondary_player_id,
  read_score_award_points,
  resolve_event_score_award,
} from "./GameEventStoredFacts";
import {
  create_score_award_resolver,
  NO_SCORE_AWARD,
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
} from "./SportEventCatalog";

const CURRENT_RULES = create_score_award_resolver([
  { event_type: "goal", points_awarded: 3 },
  { event_type: "own_goal", points_awarded: 3 },
]);

function build_event(overrides: Partial<GameEvent>): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "Ann Home",
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as GameEvent;
}

describe("GameEventStoredFacts readers", () => {
  it("reads stored facts as present options", () => {
    const event = build_event({
      points_awarded: 2,
      period_id: "first_half",
      player_id: "player_1",
      secondary_player_id: "player_2",
    } as Partial<GameEvent>);
    expect(read_event_points_awarded(event)).toEqual(create_some_option(2));
    expect(read_event_period_id(event)).toEqual(
      create_some_option("first_half"),
    );
    expect(read_event_player_id(event)).toEqual(create_some_option("player_1"));
    expect(read_event_secondary_player_id(event)).toEqual(
      create_some_option("player_2"),
    );
  });

  it("reads missing or blank facts on older events as absent", () => {
    const event = build_event({ player_id: "" } as Partial<GameEvent>);
    expect(read_event_points_awarded(event)).toEqual(create_none_option());
    expect(read_event_period_id(event)).toEqual(create_none_option());
    expect(read_event_player_id(event)).toEqual(create_none_option());
    expect(read_event_secondary_player_id(event)).toEqual(create_none_option());
  });
});

describe("read_score_award_points", () => {
  it("returns the award points or zero when nothing is scored", () => {
    expect(read_score_award_points(NO_SCORE_AWARD)).toBe(0);
    expect(read_score_award_points(CURRENT_RULES("goal"))).toBe(3);
  });
});

describe("resolve_event_score_award", () => {
  it("prefers the points stored on the event over the current rules", () => {
    const award = resolve_event_score_award(
      build_event({ points_awarded: 1 } as Partial<GameEvent>),
      CURRENT_RULES,
    );
    expect(award).toEqual({
      kind: SCORE_AWARD_KIND.CREDIT,
      credited_side: SCORE_CREDITED_SIDE.ACTING,
      points: 1,
    });
  });

  it("treats a stored zero as a non-scoring event", () => {
    const award = resolve_event_score_award(
      build_event({ points_awarded: 0 } as Partial<GameEvent>),
      CURRENT_RULES,
    );
    expect(award).toEqual(NO_SCORE_AWARD);
  });

  it("credits stored own goal points to the opposing side", () => {
    const award = resolve_event_score_award(
      build_event({
        event_type: "own_goal",
        points_awarded: 1,
      } as Partial<GameEvent>),
      CURRENT_RULES,
    );
    expect(award).toMatchObject({
      credited_side: SCORE_CREDITED_SIDE.OPPOSING,
      points: 1,
    });
  });

  it("uses the current rules for older events without stored points", () => {
    expect(resolve_event_score_award(build_event({}), CURRENT_RULES)).toEqual(
      CURRENT_RULES("goal"),
    );
  });
});
