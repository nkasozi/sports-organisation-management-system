import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  build_game_clock_state,
  get_event_bg_class,
  get_next_period,
  get_period_start_seconds,
  PERIOD_DURATION_SECONDS,
  sort_game_events,
} from "./gameManageState";

function create_test_game_event(
  overrides: Partial<ScalarInput<GameEvent>> = {},
): GameEvent {
  return {
    id: overrides.id ?? "event_1",
    event_type: overrides.event_type ?? "goal",
    minute: overrides.minute ?? 12,
    stoppage_time_minute: overrides.stoppage_time_minute ?? null,
    team_side: overrides.team_side ?? "home",
    player_name: overrides.player_name ?? "Player One",
    secondary_player_name: overrides.secondary_player_name ?? "",
    description: overrides.description ?? "Goal",
    recorded_at: overrides.recorded_at ?? "2024-01-01T10:00:00.000Z",
  } as unknown as GameEvent;
}

describe("game manage clock helpers", () => {
  it("builds a countdown display from the current clock seconds", () => {
    expect(build_game_clock_state(5 * 60, "first_half")).toMatchObject({
      elapsed_minutes: 5,
      remaining_seconds_in_period: 40 * 60,
      clock_display: "40:00",
    });
  });

  it("returns the second-half start at the end of regulation time", () => {
    expect(get_period_start_seconds("second_half")).toBe(
      PERIOD_DURATION_SECONDS,
    );
  });
});

describe("game manage event helpers", () => {
  it("sorts events by minute and then recorded time descending", () => {
    const sorted = sort_game_events([
      create_test_game_event({
        id: "event_1",
        minute: 10,
        recorded_at: "2024-01-01T10:00:00.000Z",
      }),
      create_test_game_event({
        id: "event_2",
        minute: 20,
        recorded_at: "2024-01-01T09:00:00.000Z",
      }),
      create_test_game_event({
        id: "event_3",
        minute: 20,
        recorded_at: "2024-01-01T11:00:00.000Z",
      }),
    ]);

    expect(sorted.map((event) => event.id)).toEqual([
      "event_3",
      "event_2",
      "event_1",
    ]);
  });

  it("maps period events to the purple timeline styling", () => {
    expect(
      get_event_bg_class(
        create_test_game_event({ event_type: "period_start" }),
      ),
    ).toContain("border-l-purple-500");
  });
});

describe("game manage period flow", () => {
  it("returns the next period for halftime and extra time", () => {
    expect(get_next_period("half_time")).toBe("second_half");
    expect(get_next_period("extra_time_first")).toBe("extra_time_second");
  });
});
