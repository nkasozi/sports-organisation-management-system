import { describe, expect, it } from "vitest";

import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS, STAGE_TYPE } from "$lib/core/entities/StatusConstants";

import {
  BRACKET_OUTCOME_STATUS,
  type BracketRound,
  type BracketSlot,
  build_competition_bracket,
} from "./competitionBracket";
import { PRESENCE_STATUS } from "./presenceStatus";

function build_stage(
  id: string,
  stage_order: number,
  stage_type: string = STAGE_TYPE.KNOCKOUT_STAGE,
): CompetitionStage {
  return { id, name: id, stage_order, stage_type } as CompetitionStage;
}

function build_fixture(
  id: string,
  stage_id: string,
  teams: [string, string],
  scores: [number, number],
  overrides: Partial<Fixture> = {},
): Fixture {
  return {
    id,
    stage_id,
    home_team_id: teams[0],
    away_team_id: teams[1],
    home_team_score: scores[0],
    away_team_score: scores[1],
    scheduled_date: `2026-04-${id.padStart(2, "0")}`,
    scheduled_time: "13:00",
    status: FIXTURE_STATUS.COMPLETED,
    ...overrides,
  } as Fixture;
}

function describe_slots(round: BracketRound): string[] {
  return round.slots.map((slot: BracketSlot) =>
    slot.status === PRESENCE_STATUS.PRESENT
      ? `${slot.tie.first_team.team_id}-${slot.tie.second_team.team_id}`
      : "TBD",
  );
}

const quarter_finals = build_stage("quarters", 2);
const semi_finals = build_stage("semis", 3);
const final_stage = build_stage("final", 4);
const league = build_stage("league", 1, STAGE_TYPE.LEAGUE_STAGE);

const quarter_fixtures = [
  build_fixture("1", "quarters", ["a", "b"], [2, 0]),
  build_fixture("2", "quarters", ["c", "d"], [0, 1]),
  build_fixture("3", "quarters", ["e", "f"], [3, 1]),
  build_fixture("4", "quarters", ["g", "h"], [1, 2]),
];

describe("build_competition_bracket", () => {
  it("only includes knockout stages, in stage order", () => {
    const bracket = build_competition_bracket({
      stages: [final_stage, league, quarter_finals, semi_finals],
      fixtures: quarter_fixtures,
    });

    expect(bracket.map((round) => round.stage.id)).toEqual([
      "quarters",
      "semis",
      "final",
    ]);
  });

  it("fills later rounds with placeholders until fixtures exist", () => {
    const bracket = build_competition_bracket({
      stages: [quarter_finals, semi_finals, final_stage],
      fixtures: quarter_fixtures,
    });

    expect(describe_slots(bracket[0])).toEqual(["a-b", "c-d", "e-f", "g-h"]);
    expect(describe_slots(bracket[1])).toEqual(["TBD", "TBD"]);
    expect(describe_slots(bracket[2])).toEqual(["TBD"]);
  });

  it("places each tie beside the earlier ties its teams came from", () => {
    const bracket = build_competition_bracket({
      stages: [quarter_finals, semi_finals],
      fixtures: [
        ...quarter_fixtures,
        build_fixture("5", "semis", ["e", "h"], [1, 0]),
        build_fixture("6", "semis", ["a", "d"], [0, 0], {
          status: FIXTURE_STATUS.SCHEDULED,
        }),
      ],
    });

    expect(describe_slots(bracket[1])).toEqual(["a-d", "e-h"]);
  });

  it("marks the winner of a completed tie", () => {
    const [round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [quarter_fixtures[1]],
    });
    const slot = round.slots[0];

    expect(slot.status).toBe(PRESENCE_STATUS.PRESENT);
    expect(slot.status === PRESENCE_STATUS.PRESENT && slot.tie.outcome).toEqual(
      { status: BRACKET_OUTCOME_STATUS.DECIDED, winner_team_id: "d" },
    );
  });

  it("aggregates two legs and leaves an unfinished tie undecided", () => {
    const first_leg = build_fixture("1", "quarters", ["a", "b"], [2, 1]);
    const second_leg = build_fixture("2", "quarters", ["b", "a"], [3, 0]);
    const [decided_round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [first_leg, second_leg],
    });
    const [undecided_round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [
        first_leg,
        { ...second_leg, status: FIXTURE_STATUS.IN_PROGRESS },
      ],
    });
    const decided_slot = decided_round.slots[0];
    const undecided_slot = undecided_round.slots[0];

    expect(decided_round.slots).toHaveLength(1);
    expect(
      decided_slot.status === PRESENCE_STATUS.PRESENT && decided_slot.tie,
    ).toMatchObject({
      first_team: { team_id: "a", score: 2 },
      second_team: { team_id: "b", score: 4 },
      outcome: { status: BRACKET_OUTCOME_STATUS.DECIDED, winner_team_id: "b" },
    });
    expect(
      undecided_slot.status === PRESENCE_STATUS.PRESENT &&
        undecided_slot.tie.outcome,
    ).toEqual({ status: BRACKET_OUTCOME_STATUS.UNDECIDED });
  });

  it("settles a level tie with the shootout", () => {
    const [round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [
        build_fixture("1", "quarters", ["a", "b"], [1, 1], {
          shootout_home_score: 3,
          shootout_away_score: 4,
        }),
      ],
    });
    const slot = round.slots[0];

    expect(slot.status === PRESENCE_STATUS.PRESENT && slot.tie.outcome).toEqual(
      { status: BRACKET_OUTCOME_STATUS.DECIDED, winner_team_id: "b" },
    );
  });

  it("returns no rounds when the competition has no knockout stages", () => {
    expect(
      build_competition_bracket({ stages: [league], fixtures: [] }),
    ).toEqual([]);
  });
});
