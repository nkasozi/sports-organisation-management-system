import { describe, expect, it } from "vitest";

import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS, STAGE_TYPE } from "$lib/core/entities/StatusConstants";

import {
  BRACKET_OUTCOME_STATUS,
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

const quarter_finals = build_stage("quarters", 2);

describe("bracket scores", () => {
  it("shows no score for a tie that has not started", () => {
    const [round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [
        build_fixture("1", "quarters", ["a", "b"], [0, 0], {
          status: FIXTURE_STATUS.SCHEDULED,
          home_team_score: undefined as unknown as number,
          away_team_score: undefined as unknown as number,
        }),
      ],
    });
    const slot = round.slots[0];

    expect(slot.status === PRESENCE_STATUS.PRESENT && slot.tie).toMatchObject({
      first_team: { score: { status: PRESENCE_STATUS.MISSING } },
      second_team: { score: { status: PRESENCE_STATUS.MISSING } },
      outcome: { status: BRACKET_OUTCOME_STATUS.UNDECIDED },
    });
  });

  it("only adds up the legs that have started", () => {
    const [round] = build_competition_bracket({
      stages: [quarter_finals],
      fixtures: [
        build_fixture("1", "quarters", ["a", "b"], [2, 1]),
        build_fixture("2", "quarters", ["b", "a"], [0, 0], {
          status: FIXTURE_STATUS.SCHEDULED,
          home_team_score: undefined as unknown as number,
          away_team_score: undefined as unknown as number,
        }),
      ],
    });
    const slot = round.slots[0];

    expect(slot.status === PRESENCE_STATUS.PRESENT && slot.tie).toMatchObject({
      first_team: { score: { status: PRESENCE_STATUS.PRESENT, value: 2 } },
      second_team: { score: { status: PRESENCE_STATUS.PRESENT, value: 1 } },
      outcome: { status: BRACKET_OUTCOME_STATUS.UNDECIDED },
    });
  });
});
