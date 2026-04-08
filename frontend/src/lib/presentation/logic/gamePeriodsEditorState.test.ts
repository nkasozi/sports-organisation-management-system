import { describe, expect, it } from "vitest";

import {
  append_game_break,
  append_game_period,
  build_game_period_editor_summary,
  build_game_period_preset,
  move_game_period_down,
  move_game_period_up,
  remove_game_period,
  rename_game_period,
  set_game_period_duration,
} from "./gamePeriodsEditorState";

describe("gamePeriodsEditorState", () => {
  it("builds sorted summary totals for playing periods and breaks", () => {
    expect(
      build_game_period_editor_summary([
        {
          id: "break_1",
          name: "Break",
          duration_minutes: 10,
          is_break: true,
          order: 2,
        },
        {
          id: "period_1",
          name: "Period 1",
          duration_minutes: 15,
          is_break: false,
          order: 1,
        },
      ] as never),
    ).toEqual({
      sorted_periods: [
        {
          id: "period_1",
          name: "Period 1",
          duration_minutes: 15,
          is_break: false,
          order: 1,
        },
        {
          id: "break_1",
          name: "Break",
          duration_minutes: 10,
          is_break: true,
          order: 2,
        },
      ],
      total_break_time: 10,
      total_playing_time: 15,
      total_time: 25,
    });
  });

  it("appends, reorders, updates, and removes periods", () => {
    const appended_periods = append_game_period([] as never);
    const appended_breaks = append_game_break(appended_periods as never);
    const renamed_periods = rename_game_period(
      appended_breaks as never,
      "period_1",
      "Opening Period",
    );
    const resized_periods = set_game_period_duration(
      renamed_periods as never,
      "break_1",
      12,
    );
    const moved_periods = move_game_period_up(
      move_game_period_down(resized_periods as never, "period_1") as never,
      "period_1",
    );

    expect(moved_periods).toEqual([
      {
        id: "period_1",
        name: "Opening Period",
        duration_minutes: 15,
        is_break: false,
        order: 1,
      },
      {
        id: "break_1",
        name: "Break",
        duration_minutes: 12,
        is_break: true,
        order: 2,
      },
    ]);
    expect(remove_game_period(moved_periods as never, "break_1")).toEqual([
      {
        id: "period_1",
        name: "Opening Period",
        duration_minutes: 15,
        is_break: false,
        order: 1,
      },
    ]);
  });

  it("builds common period presets for halves, quarters, and thirds", () => {
    expect(build_game_period_preset("halves")).toHaveLength(3);
    expect(build_game_period_preset("quarters")).toHaveLength(7);
    expect(
      build_game_period_preset("thirds").map((period) => period.name),
    ).toEqual([
      "1st Period",
      "Intermission",
      "2nd Period",
      "Intermission",
      "3rd Period",
    ]);
  });
});
