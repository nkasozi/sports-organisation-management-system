import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";

import {
  build_match_player_entry,
  type CardTypeConfig,
  extract_goals_from_events,
  get_team_initials,
} from "./MatchReportTypes";

const LEGACY_SCORING = create_score_award_resolver([]);

function build_event(
  event_type: string,
  team_side: string,
  minute: number,
  player_name: string,
): GameEvent {
  return {
    id: `event_${minute}`,
    event_type,
    minute,
    stoppage_time_minute: 0,
    team_side,
    player_name,
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-01-01T00:00:00Z",
  } as GameEvent;
}

function build_player(
  first_name: string,
  last_name: string,
  jersey_number: number,
  is_substitute: boolean,
  time_on: string,
): LineupPlayer {
  return {
    id: `${first_name}_${last_name}`,
    first_name,
    last_name,
    jersey_number,
    position: "",
    is_captain: false,
    is_substitute,
    time_on,
  } as LineupPlayer;
}

const YELLOW_CARD: CardTypeConfig = {
  id: "yc",
  name: "Yellow",
  color: "#ff0",
  event_type: "yellow_card",
};

describe("build_match_player_entry", () => {
  it("marks starters with X and collects cards for the player", () => {
    const player = build_player("Jane", "Doe", 7, false, "present_at_start");
    const events = [
      build_event("yellow_card", "home", 12, "Jane Doe"),
      build_event("yellow_card", "away", 13, "Jane Doe"),
    ];
    const entry = build_match_player_entry(player, events, "home", [
      YELLOW_CARD,
    ]);
    expect(entry).toEqual({
      time_on: "X",
      jersey_number: 7,
      name: "JANE DOE",
      cards: [{ minute: "12'", card_type: "yc" }],
    });
  });

  it("formats substitute minute and marks unused starters with X", () => {
    const substitute = build_player("Sam", "Sub", 14, true, "55");
    const unused_starter = build_player("Una", "Used", 3, false, "didnt_play");
    const unused_substitute = build_player("Ben", "Bench", 15, true, "");
    expect(build_match_player_entry(substitute, [], "home", []).time_on).toBe(
      "55'",
    );
    expect(
      build_match_player_entry(unused_starter, [], "home", []).time_on,
    ).toBe("X");
    expect(
      build_match_player_entry(unused_substitute, [], "home", []).time_on,
    ).toBe("");
  });
});

describe("extract_goals_from_events", () => {
  it("orders goals, credits own goals to the opponent and tracks score", () => {
    const home_players = [build_player("Ann", "Home", 9, false, "")];
    const away_players = [build_player("Bob", "Away", 4, false, "")];
    const events = [
      build_event("own_goal", "away", 30, "Bob Away"),
      build_event("goal", "home", 10, "Ann Home"),
      build_event("penalty_scored", "away", 40, "Bob Away"),
      build_event("own_goal", "home", 50, "Ann Home"),
      build_event("yellow_card", "home", 20, "Ann Home"),
    ];
    const goals = extract_goals_from_events(
      events,
      "HOM",
      "AWY",
      home_players,
      away_players,
      LEGACY_SCORING,
    );
    expect(goals).toEqual([
      {
        team_initials: "HOM",
        minute: 10,
        jersey_number: 9,
        action: "FG",
        score: "1-0",
      },
      {
        team_initials: "HOM",
        minute: 30,
        jersey_number: 4,
        action: "OG",
        score: "2-0",
      },
      {
        team_initials: "AWY",
        minute: 40,
        jersey_number: 4,
        action: "PC",
        score: "2-1",
      },
      {
        team_initials: "AWY",
        minute: 50,
        jersey_number: 9,
        action: "OG",
        score: "2-2",
      },
    ]);
  });

  it("uses ? when the scorer cannot be matched", () => {
    const goals = extract_goals_from_events(
      [
        build_event("goal", "home", 5, ""),
        build_event("goal", "home", 6, "Nobody"),
      ],
      "HOM",
      "AWY",
      [],
      [],
      LEGACY_SCORING,
    );
    expect(goals.map((goal) => goal.jersey_number)).toEqual(["?", "?"]);
  });

  it("counts each score with the points the sport awards", () => {
    const goals = extract_goals_from_events(
      [
        build_event("super_shot", "home", 3, ""),
        build_event("goal", "away", 4, ""),
        build_event("foul", "away", 5, ""),
      ],
      "HOM",
      "AWY",
      [],
      [],
      create_score_award_resolver([
        { event_type: "goal", points_awarded: 1 },
        { event_type: "super_shot", points_awarded: 2 },
      ]),
    );
    expect(
      goals.map((goal) => [goal.team_initials, goal.action, goal.score]),
    ).toEqual([
      ["HOM", "SS", "2-0"],
      ["AWY", "FG", "2-1"],
    ]);
  });
});

describe("get_team_initials", () => {
  it("keeps short single words and abbreviates longer names", () => {
    expect(get_team_initials("kcc")).toBe("KCC");
    expect(get_team_initials("Kampala Hockey Club United")).toBe("KHC");
  });
});
