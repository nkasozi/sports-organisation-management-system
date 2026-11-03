import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import {
  BRACKET_OUTCOME_STATUS,
  build_bracket_match,
} from "./competitionBracketMatch";
import { PRESENCE_STATUS } from "./presenceStatus";

function build_fixture(overrides: Record<string, unknown>): Fixture {
  return {
    id: "fixture_1",
    stage_id: "quarters",
    home_team_id: "rockets",
    away_team_id: "khc",
    home_team_score: 3,
    away_team_score: 2,
    scheduled_date: "2026-04-25",
    scheduled_time: "13:00",
    status: FIXTURE_STATUS.COMPLETED,
    ...overrides,
  } as unknown as Fixture;
}

describe("build_bracket_match", () => {
  it("shows this game's own score and its winner once it is finished", () => {
    expect(build_bracket_match(build_fixture({}))).toMatchObject({
      fixture_id: "fixture_1",
      home: {
        team_id: "rockets",
        score: { status: PRESENCE_STATUS.PRESENT, value: 3 },
      },
      away: {
        team_id: "khc",
        score: { status: PRESENCE_STATUS.PRESENT, value: 2 },
      },
      outcome: {
        status: BRACKET_OUTCOME_STATUS.DECIDED,
        winner_team_id: "rockets",
      },
    });
  });

  it("shows no score and no winner before the game starts", () => {
    expect(
      build_bracket_match(
        build_fixture({
          status: FIXTURE_STATUS.SCHEDULED,
          home_team_score: undefined,
          away_team_score: undefined,
        }),
      ),
    ).toMatchObject({
      home: { score: { status: PRESENCE_STATUS.MISSING } },
      away: { score: { status: PRESENCE_STATUS.MISSING } },
      outcome: { status: BRACKET_OUTCOME_STATUS.UNDECIDED },
    });
  });

  it("shows the live score but no winner while the game is in progress", () => {
    expect(
      build_bracket_match(
        build_fixture({ status: FIXTURE_STATUS.IN_PROGRESS }),
      ),
    ).toMatchObject({
      home: { score: { status: PRESENCE_STATUS.PRESENT, value: 3 } },
      outcome: { status: BRACKET_OUTCOME_STATUS.UNDECIDED },
    });
  });

  it("settles a level game with the shootout, and leaves a plain draw undecided", () => {
    expect(
      build_bracket_match(
        build_fixture({
          home_team_score: 1,
          away_team_score: 1,
          shootout_home_score: 3,
          shootout_away_score: 4,
        }),
      ).outcome,
    ).toEqual({
      status: BRACKET_OUTCOME_STATUS.DECIDED,
      winner_team_id: "khc",
    });
    expect(
      build_bracket_match(
        build_fixture({ home_team_score: 2, away_team_score: 2 }),
      ).outcome,
    ).toEqual({ status: BRACKET_OUTCOME_STATUS.UNDECIDED });
  });
});
