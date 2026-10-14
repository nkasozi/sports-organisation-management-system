import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import type { TeamStanding } from "./competitionStageResults";
import { build_fair_play_card_weights } from "./competitionStandingsFairPlay";
import {
  apply_single_tiebreaker,
  sort_standings_by_tiebreakers,
} from "./competitionStandingsTiebreakers";
import { calculate_team_standings } from "./competitionTeamStandings";

const CARD_WEIGHTS = build_fair_play_card_weights([
  { id: "green_card", severity: "suspension" },
  { id: "yellow_card", severity: "warning" },
  { id: "red_card", severity: "ejection" },
]);

function standing(team_id: string, points: number = 3): TeamStanding {
  return {
    team_id,
    team_name: team_id,
    team_logo_url: "",
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    goals_for: 1,
    goals_against: 0,
    goal_difference: 1,
    points,
    form: [],
    requires_playoff: false,
  };
}

function card_event(event_type: string, team_side: "home" | "away"): unknown {
  return {
    id: `${event_type}-${team_side}`,
    event_type,
    team_side,
    minute: 10,
  };
}

function fixture_with_cards(
  home_team_id: string,
  away_team_id: string,
  game_events: unknown[],
): Fixture {
  return {
    id: `${home_team_id}-${away_team_id}`,
    competition_id: "comp-1",
    home_team_id,
    away_team_id,
    home_team_score: 0,
    away_team_score: 0,
    status: "completed",
    game_events,
  } as unknown as Fixture;
}

describe("fair play tiebreaker", () => {
  it("ranks the team with fewer weighted card points higher", () => {
    const fixtures = [
      fixture_with_cards("team-a", "team-b", [
        card_event("red_card", "home"),
        card_event("yellow_card", "home"),
        card_event("yellow_card", "away"),
        card_event("green_card", "away"),
      ]),
    ];
    const sorted = sort_standings_by_tiebreakers(
      [standing("team-a"), standing("team-b")],
      fixtures,
      ["fair_play"],
      void 0,
      CARD_WEIGHTS,
    );
    expect(sorted.map((entry) => entry.team_id)).toEqual(["team-b", "team-a"]);
  });

  it("ignores events that are not cards of the sport", () => {
    const fixtures = [
      fixture_with_cards("team-a", "team-b", [card_event("goal", "home")]),
    ];
    expect(
      apply_single_tiebreaker(
        standing("team-a"),
        standing("team-b"),
        fixtures,
        "fair_play",
        { points_for_win: 3, points_for_draw: 1, points_for_loss: 0 } as never,
        CARD_WEIGHTS,
      ),
    ).toBe(0);
  });
});

describe("drawing of lots tiebreaker", () => {
  it("orders tied teams deterministically regardless of input order", () => {
    const fixtures = [fixture_with_cards("team-a", "team-b", [])];
    const first = sort_standings_by_tiebreakers(
      [standing("team-a"), standing("team-b"), standing("team-c")],
      fixtures,
      ["draw"],
    ).map((entry) => entry.team_id);
    const second = sort_standings_by_tiebreakers(
      [standing("team-c"), standing("team-b"), standing("team-a")],
      fixtures,
      ["draw"],
    ).map((entry) => entry.team_id);
    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(3);
  });
});

describe("playoff tiebreaker", () => {
  it("flags teams still level as requiring a playoff", () => {
    const sorted = sort_standings_by_tiebreakers(
      [standing("team-a"), standing("team-b"), standing("team-c", 1)],
      [],
      ["goal_difference", "playoff"],
    );
    expect(
      sorted.map((entry) => [entry.team_id, entry.requires_playoff]),
    ).toEqual([
      ["team-a", true],
      ["team-b", true],
      ["team-c", false],
    ]);
  });

  it("does not flag teams separated before the playoff step", () => {
    const sorted = sort_standings_by_tiebreakers(
      [standing("team-a"), { ...standing("team-b"), goal_difference: 5 }],
      [],
      ["goal_difference", "playoff"],
    );
    expect(sorted.every((entry) => !entry.requires_playoff)).toBe(true);
  });
});

describe("head to head uses the competition points config", () => {
  it("applies the configured points for a win in the mini league", () => {
    const fixtures = [
      {
        ...fixture_with_cards("team-a", "team-b", []),
        home_team_score: 0,
        away_team_score: 1,
      },
      {
        ...fixture_with_cards("team-b", "team-a", []),
        id: "second",
        home_team_score: 0,
        away_team_score: 0,
      },
    ] as Fixture[];
    const result = apply_single_tiebreaker(
      standing("team-a"),
      standing("team-b"),
      fixtures,
      "head_to_head",
      { points_for_win: 0, points_for_draw: 0, points_for_loss: 10 } as never,
      CARD_WEIGHTS,
    );
    expect(result).toBeLessThan(0);
  });
});

describe("calculate_team_standings", () => {
  it("starts every team without a playoff flag", () => {
    const standings = calculate_team_standings(
      [],
      [{ id: "team-a", name: "A", logo_url: "" } as never],
    );
    expect(standings[0].requires_playoff).toBe(false);
  });
});
