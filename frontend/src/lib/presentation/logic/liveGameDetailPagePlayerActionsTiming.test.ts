import { beforeEach, describe, expect, it, vi } from "vitest";

import { record_live_game_detail_page_event_action } from "./liveGameDetailPagePlayerActions";
import { EVENT_TIMING_MESSAGE } from "./liveGameEventTiming";

const { record_live_game_detail_event_mock } = vi.hoisted(() => ({
  record_live_game_detail_event_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/liveGameDetailActions", () => ({
  record_live_game_detail_timed_event: record_live_game_detail_event_mock,
  update_live_game_player_time_on: vi.fn(),
}));

describe("recording live game events at the right game time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records first-half stoppage time against the first half", async () => {
    record_live_game_detail_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });

    await record_live_game_detail_page_event_action({
      away_lineup_id: "away-lineup",
      away_players: [],
      event_description: "",
      event_minute: 47,
      event_player_name: "Ada Stone",
      fixture_id: "fixture-1",
      fixture_lineup_use_cases: {},
      fixture_use_cases: {},
      home_lineup_id: "home-lineup",
      home_players: [],
      is_substitution_event: false,
      secondary_player_name: "",
      selected_event_type: { id: "goal", label: "Goal" },
      selected_player_id: "",
      selected_team_side: "home",
      event_timing: {
        effective_periods: [
          {
            id: "first_half",
            name: "1st Half",
            duration_minutes: 45,
            is_break: false,
            order: 1,
          },
        ],
        current_period_id: { status: "some", value: "first_half" },
        elapsed_minutes: 47,
      },
    } as never);

    expect(record_live_game_detail_event_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        minute: 45,
        stoppage_time_minute: 2,
        period: { status: "some", value: "first_half" },
      }),
    );
  });

  it("refuses an event minute that has not been played yet", async () => {
    const result = await record_live_game_detail_page_event_action({
      event_minute: 80,
      fixture_id: "fixture-1",
      is_substitution_event: false,
      selected_event_type: { id: "goal", label: "Goal" },
      event_timing: {
        effective_periods: [],
        current_period_id: { status: "none" },
        elapsed_minutes: 30,
      },
    } as never);

    expect(result).toEqual({
      success: false,
      error_message: EVENT_TIMING_MESSAGE.MINUTE_NOT_PLAYED,
    });
    expect(record_live_game_detail_event_mock).not.toHaveBeenCalled();
  });
});
