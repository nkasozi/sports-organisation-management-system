import { describe, expect, it } from "vitest";

import { derive_live_overtime_periods } from "./liveGameOvertimePeriods";

const SPORT = {
  periods: [
    {
      id: "first_half",
      name: "1st Half",
      duration_minutes: 45,
      is_break: false,
      order: 1,
    },
    {
      id: "half_time",
      name: "Half Time",
      duration_minutes: 15,
      is_break: true,
      order: 2,
    },
    {
      id: "second_half",
      name: "2nd Half",
      duration_minutes: 45,
      is_break: false,
      order: 3,
    },
  ],
  overtime_rules: {
    is_enabled: true,
    trigger_condition: "knockout_draw",
    overtime_type: "extra_time",
    extra_time_periods: [
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
    ],
    penalties_config: { initial_rounds: 5, sudden_death_after: true },
  },
} as never;

function page_state(fixture: Record<string, unknown>): never {
  return {
    sport: SPORT,
    stage: { stage_type: "knockout_stage" },
    fixture: {
      status: "in_progress",
      home_team_score: 1,
      away_team_score: 1,
      game_events: [],
      ...fixture,
    },
  } as never;
}

describe("derive_live_overtime_periods", () => {
  it("keeps only regulation periods while regulation is being played", () => {
    const result = derive_live_overtime_periods(
      page_state({ current_period: "second_half" }),
    );
    expect(result.effective_periods.map((period) => period.id)).toEqual([
      "first_half",
      "half_time",
      "second_half",
    ]);
    expect(result.overtime_button.status).toBe("none");
  });

  it("offers extra time at full time of a level knockout game", () => {
    const result = derive_live_overtime_periods(
      page_state({ current_period: "finished" }),
    );
    expect(result.effective_periods.map((period) => period.id)).toContain(
      "extra_time_1",
    );
    expect(result.overtime_button).toMatchObject({
      status: "some",
      value: { next_period: "extra_time_1", is_end_action: false },
    });
  });

  it("keeps extra time periods once extra time has started", () => {
    const result = derive_live_overtime_periods(
      page_state({ current_period: "extra_time_1" }),
    );
    expect(result.effective_periods.map((period) => period.id)).toEqual([
      "first_half",
      "half_time",
      "second_half",
      "extra_time_1",
      "extra_time_2",
    ]);
  });

  it("offers the shootout after level extra time", () => {
    const result = derive_live_overtime_periods(
      page_state({
        current_period: "finished",
        game_events: [{ id: "e", period_id: "extra_time_2" }],
      }),
    );
    expect(result.overtime_button).toMatchObject({
      status: "some",
      value: { next_period: "penalty_shootout" },
    });
  });

  it("offers nothing at full time when a team has won", () => {
    const result = derive_live_overtime_periods(
      page_state({ current_period: "finished", home_team_score: 2 }),
    );
    expect(result.overtime_button.status).toBe("none");
  });
});
