import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";

import { extract_goals_from_events } from "./MatchReportGoals";

const CURRENT_RULES = create_score_award_resolver([
  { event_type: "goal", points_awarded: 5 },
]);

function build_event(overrides: Partial<GameEvent>): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "",
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as GameEvent;
}

function build_player(
  id: string,
  first_name: string,
  jersey_number: number,
): LineupPlayer {
  return {
    id,
    first_name,
    last_name: "Home",
    jersey_number,
    position: "",
    is_captain: false,
    is_substitute: false,
  } as LineupPlayer;
}

describe("extract_goals_from_events with stored event facts", () => {
  it("keeps the score the event was worth when it was recorded", () => {
    const goals = extract_goals_from_events(
      [
        build_event({ points_awarded: 1 } as Partial<GameEvent>),
        build_event({
          id: "e2",
          minute: 20,
          points_awarded: 0,
        } as Partial<GameEvent>),
      ],
      "HOM",
      "AWY",
      [],
      [],
      CURRENT_RULES,
    );
    expect(goals.map((goal) => goal.score)).toEqual(["1-0"]);
  });

  it("finds the scorer's jersey by player id before name", () => {
    const goals = extract_goals_from_events(
      [
        build_event({
          player_name: "Renamed Player",
          player_id: "player_2",
        } as Partial<GameEvent>),
      ],
      "HOM",
      "AWY",
      [
        build_player("player_1", "Renamed", 7),
        build_player("player_2", "Ann", 9),
      ],
      [],
      CURRENT_RULES,
    );
    expect(goals[0].jersey_number).toBe(9);
  });
});
