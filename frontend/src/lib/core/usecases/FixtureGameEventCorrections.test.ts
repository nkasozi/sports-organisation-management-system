import { describe, expect, it } from "vitest";

import type { Fixture, GameEvent } from "../entities/Fixture";
import {
  create_edited_event_plan,
  create_removed_event_plan,
  find_correctable_event,
  type GameEventCorrection,
} from "./FixtureGameEventCorrections";

function event(overrides: Record<string, unknown>): GameEvent {
  return {
    id: "e1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "Moses Alowo",
    secondary_player_name: "",
    description: "",
    recorded_at: "2026-10-25T10:00:00Z",
    points_awarded: 1,
    period_id: "first_quarter",
    ...overrides,
  } as GameEvent;
}

function fixture(
  game_events: GameEvent[],
  scores = { home: 2, away: 1 },
): Fixture {
  return {
    id: "f1",
    game_events,
    home_team_score: scores.home,
    away_team_score: scores.away,
    shootout_home_score: 3,
    shootout_away_score: 2,
  } as unknown as Fixture;
}

describe("correcting recorded game events", () => {
  it("removes a goal and takes it off the score", () => {
    const goal = event({});
    const plan = create_removed_event_plan(
      fixture([
        goal,
        event({ id: "e2", event_type: "yellow_card", points_awarded: 0 }),
      ]),
      "e1",
    );
    expect(plan.updates.game_events?.map((e) => e.id)).toEqual(["e2"]);
    expect(plan.updates).toMatchObject({
      home_team_score: 1,
      away_team_score: 1,
    });
  });

  it("credits the other side back for an own goal", () => {
    const own_goal = event({ event_type: "own_goal", team_side: "home" });
    const plan = create_removed_event_plan(fixture([own_goal]), "e1");
    expect(plan.updates).toMatchObject({
      home_team_score: 2,
      away_team_score: 0,
    });
  });

  it("removes a shootout goal from the shootout score only", () => {
    const kick = event({ period_id: "penalty_shootout", team_side: "away" });
    const plan = create_removed_event_plan(fixture([kick]), "e1");
    expect(plan.updates).toMatchObject({
      shootout_home_score: 3,
      shootout_away_score: 1,
    });
    expect(plan.updates.home_team_score).toBeUndefined();
  });

  it("removes a card without touching the score", () => {
    const card = event({ event_type: "yellow_card", points_awarded: 0 });
    const plan = create_removed_event_plan(fixture([card]), "e1");
    expect(plan.updates).toMatchObject({
      home_team_score: 2,
      away_team_score: 1,
    });
  });

  it("edits the player, minute and note of an event and keeps the score", () => {
    const plan = create_edited_event_plan(fixture([event({})]), "e1", {
      player_id: "p9",
      player_name: "Kenneth Amuge",
      minute: 12,
      description: "Deflected in",
    } as unknown as GameEventCorrection);
    expect(plan.updates.game_events?.[0]).toMatchObject({
      id: "e1",
      event_type: "goal",
      team_side: "home",
      player_id: "p9",
      player_name: "Kenneth Amuge",
      minute: 12,
      description: "Deflected in",
    });
    expect(plan.updates.home_team_score).toBeUndefined();
  });

  it("finds only team events that exist", () => {
    const match_event = event({ id: "m1", team_side: "match" });
    const current = fixture([event({}), match_event]);
    expect(find_correctable_event(current, "e1").status).toBe("some");
    expect(find_correctable_event(current, "m1").status).toBe("none");
    expect(find_correctable_event(current, "missing").status).toBe("none");
  });
});
