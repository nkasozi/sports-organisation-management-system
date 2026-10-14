import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  decide_overtime_option,
  format_shootout_tally,
  OVERTIME_OPTION,
  resolve_overtime_rules,
  SHOOTOUT_PERIOD,
} from "./liveGameOvertimePlan";

const EXTRA_TIME_PERIODS = [
  {
    id: "extra_time_1",
    name: "ET 1",
    duration_minutes: 15,
    is_break: false,
    order: 1,
  },
  {
    id: "extra_time_2",
    name: "ET 2",
    duration_minutes: 15,
    is_break: false,
    order: 2,
  },
];

const KNOCKOUT_EXTRA_TIME = {
  is_enabled: true,
  trigger_condition: "knockout_draw",
  overtime_type: "extra_time",
  extra_time_periods: EXTRA_TIME_PERIODS,
  penalties_config: { initial_rounds: 5, sudden_death_after: true },
} as never;

function decide(
  overrides: Partial<Parameters<typeof decide_overtime_option>[0]> = {},
): ReturnType<typeof decide_overtime_option> {
  return decide_overtime_option({
    overtime_rules: create_some_option(KNOCKOUT_EXTRA_TIME),
    stage_type: create_some_option("knockout_stage"),
    home_score: 1,
    away_score: 1,
    reached_period_ids: new Set(["first_half", "second_half"]),
    ...overrides,
  });
}

describe("decide_overtime_option", () => {
  it("offers extra time when a knockout game ends level", () => {
    expect(decide()).toEqual({
      kind: OVERTIME_OPTION.EXTRA_TIME,
      periods: EXTRA_TIME_PERIODS,
    });
  });

  it("offers nothing when the game has a winner", () => {
    expect(decide({ home_score: 2 })).toEqual({ kind: OVERTIME_OPTION.NONE });
  });

  it("offers nothing for a level league game when only knockout draws go to overtime", () => {
    expect(decide({ stage_type: create_some_option("league_stage") })).toEqual({
      kind: OVERTIME_OPTION.NONE,
    });
    expect(decide({ stage_type: create_none_option() })).toEqual({
      kind: OVERTIME_OPTION.NONE,
    });
  });

  it("offers a shootout when extra time has been played and it is still level", () => {
    expect(
      decide({
        reached_period_ids: new Set(["second_half", "extra_time_2"]),
      }),
    ).toEqual({ kind: OVERTIME_OPTION.SHOOTOUT });
  });

  it("offers nothing once the shootout has been played", () => {
    expect(
      decide({
        reached_period_ids: new Set(["extra_time_2", SHOOTOUT_PERIOD.id]),
      }),
    ).toEqual({ kind: OVERTIME_OPTION.NONE });
  });

  it("goes straight to a shootout for sports that settle draws with penalties", () => {
    expect(
      decide({
        overtime_rules: create_some_option({
          ...(KNOCKOUT_EXTRA_TIME as object),
          trigger_condition: "draw",
          overtime_type: "penalties",
        } as never),
        stage_type: create_none_option(),
      }),
    ).toEqual({ kind: OVERTIME_OPTION.SHOOTOUT });
  });

  it("offers nothing when overtime is disabled or replays are used", () => {
    expect(
      decide({
        overtime_rules: create_some_option({
          ...(KNOCKOUT_EXTRA_TIME as object),
          is_enabled: false,
        } as never),
      }),
    ).toEqual({ kind: OVERTIME_OPTION.NONE });
    expect(
      decide({
        overtime_rules: create_some_option({
          ...(KNOCKOUT_EXTRA_TIME as object),
          overtime_type: "replay",
        } as never),
      }),
    ).toEqual({ kind: OVERTIME_OPTION.NONE });
  });
});

describe("resolve_overtime_rules", () => {
  it("lets the competition override the sport's overtime rules", () => {
    const rules = resolve_overtime_rules(
      { overtime_rules: KNOCKOUT_EXTRA_TIME } as never,
      { rule_overrides: { overtime_rules: { is_enabled: false } } } as never,
    );
    expect(rules.status === "some" && rules.value.is_enabled).toBe(false);
  });

  it("has no rules when the sport is unknown", () => {
    expect(resolve_overtime_rules(void 0, void 0)).toEqual(
      create_none_option(),
    );
  });
});

describe("format_shootout_tally", () => {
  it("describes the shootout result once kicks have been taken", () => {
    expect(
      format_shootout_tally({ shootout_home_score: 4, shootout_away_score: 3 }),
    ).toEqual(create_some_option("(pens 4-3)"));
  });

  it("has nothing to show before a shootout", () => {
    expect(format_shootout_tally({})).toEqual(create_none_option());
  });
});
