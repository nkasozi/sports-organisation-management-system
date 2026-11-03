import { describe, expect, it } from "vitest";

import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS, STAGE_TYPE } from "$lib/core/entities/StatusConstants";

import {
  type BracketColumn,
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
  home_team_id: string,
  away_team_id: string,
  day: string,
): Fixture {
  return {
    id,
    stage_id,
    home_team_id,
    away_team_id,
    home_team_score: 1,
    away_team_score: 0,
    scheduled_date: `2026-04-${day}`,
    scheduled_time: "13:00",
    status: FIXTURE_STATUS.COMPLETED,
  } as unknown as Fixture;
}

function describe_column(column: BracketColumn): string[] {
  return column.cards.map((card) =>
    card.content.status === PRESENCE_STATUS.PRESENT
      ? `${card.content.match.fixture_id}@${card.row}`
      : `TBD@${card.row}`,
  );
}

const round_of_16 = build_stage("r16", 1);
const quarter_finals = build_stage("qf", 2);
const semi_finals = build_stage("sf", 3);
const league = build_stage("league", 0, STAGE_TYPE.LEAGUE_STAGE);

describe("build_competition_bracket", () => {
  it("only lays out knockout stages, in stage order", () => {
    const bracket = build_competition_bracket({
      stages: [semi_finals, league, round_of_16, quarter_finals],
      fixtures: [],
      show_placeholders: true,
    });

    expect(bracket.columns.map((column) => column.stage.id)).toEqual([
      "r16",
      "qf",
      "sf",
    ]);
  });

  it("shows each leg as its own game and connects both legs to the next game", () => {
    const bracket = build_competition_bracket({
      stages: [round_of_16, quarter_finals],
      fixtures: [
        build_fixture("leg1", "r16", "rockets", "wabalozi", "01"),
        build_fixture("leg2", "r16", "wabalozi", "rockets", "08"),
        build_fixture("qf1", "qf", "rockets", "khc", "15"),
      ],
      show_placeholders: true,
    });

    expect(describe_column(bracket.columns[0])).toEqual(["leg1@0", "leg2@1"]);
    expect(describe_column(bracket.columns[1])).toEqual(["qf1@0.5"]);
    expect(bracket.links).toEqual([
      { from_card_id: "leg1", to_card_id: "qf1" },
      { from_card_id: "leg2", to_card_id: "qf1" },
    ]);
  });

  it("fills games that are not known yet with placeholders fed by the games before them", () => {
    const bracket = build_competition_bracket({
      stages: [round_of_16, quarter_finals, semi_finals],
      fixtures: [
        build_fixture("a", "r16", "t1", "t2", "01"),
        build_fixture("b", "r16", "t3", "t4", "02"),
        build_fixture("c", "r16", "t5", "t6", "03"),
        build_fixture("d", "r16", "t7", "t8", "04"),
        build_fixture("qf1", "qf", "t1", "t4", "10"),
      ],
      show_placeholders: true,
    });

    expect(describe_column(bracket.columns[1])).toEqual(["qf1@0.5", "TBD@2.5"]);
    expect(describe_column(bracket.columns[2])).toEqual(["TBD@1.5"]);
    expect(bracket.links).toEqual(
      expect.arrayContaining([
        { from_card_id: "c", to_card_id: "qf-tbd-0" },
        { from_card_id: "d", to_card_id: "qf-tbd-0" },
        { from_card_id: "qf1", to_card_id: "sf-tbd-0" },
        { from_card_id: "qf-tbd-0", to_card_id: "sf-tbd-0" },
      ]),
    );
    expect(bracket.row_count).toBe(4);
  });

  it("leaves out placeholders when asked to show only the games given", () => {
    const bracket = build_competition_bracket({
      stages: [round_of_16, quarter_finals, semi_finals],
      fixtures: [
        build_fixture("a", "r16", "t1", "t2", "01"),
        build_fixture("b", "r16", "t3", "t4", "02"),
      ],
      show_placeholders: false,
    });

    expect(describe_column(bracket.columns[0])).toEqual(["a@0", "b@1"]);
    expect(describe_column(bracket.columns[1])).toEqual([]);
    expect(describe_column(bracket.columns[2])).toEqual([]);
    expect(bracket.links).toEqual([]);
  });

  it("keeps both legs of a tie next to each other, ties in order of their first leg", () => {
    const bracket = build_competition_bracket({
      stages: [round_of_16],
      fixtures: [
        build_fixture("a1", "r16", "t1", "t2", "01"),
        build_fixture("b1", "r16", "t3", "t4", "02"),
        build_fixture("a2", "r16", "t2", "t1", "08"),
        build_fixture("b2", "r16", "t4", "t3", "09"),
      ],
      show_placeholders: true,
    });

    expect(describe_column(bracket.columns[0])).toEqual([
      "a1@0",
      "a2@1",
      "b1@2",
      "b2@3",
    ]);
  });

  it("keeps cards from overlapping when they would sit at the same height", () => {
    const bracket = build_competition_bracket({
      stages: [round_of_16, quarter_finals],
      fixtures: [
        build_fixture("a", "r16", "t1", "t2", "01"),
        build_fixture("qf1", "qf", "t1", "t9", "10"),
        build_fixture("qf2", "qf", "t2", "t8", "11"),
      ],
      show_placeholders: true,
    });

    expect(describe_column(bracket.columns[1])).toEqual(["qf1@0", "qf2@1"]);
  });

  it("lays out nothing when there are no knockout stages", () => {
    expect(
      build_competition_bracket({
        stages: [league],
        fixtures: [],
        show_placeholders: true,
      }),
    ).toEqual({ columns: [], links: [], row_count: 0 });
  });
});
