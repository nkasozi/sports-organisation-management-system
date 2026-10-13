import { describe, expect, it, vi } from "vitest";

import { NO_SCORE_AWARD } from "$lib/core/entities/SportEventCatalog";

import {
  record_live_game_detail_event,
  record_live_game_detail_timed_event,
  record_live_game_extra_time_event,
} from "./liveGameDetailEventActions";

describe("liveGameDetailEventActions", () => {
  type FixtureUseCases = Parameters<typeof record_live_game_detail_event>[7];
  type SelectedEventType = Parameters<typeof record_live_game_detail_event>[1];

  it("records live-game events with the correct substitution description and player names", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    } as Pick<FixtureUseCases, "record_game_event">;
    const selected_event_type = {
      id: "substitution",
      label: "Substitution",
      score_award: NO_SCORE_AWARD,
    } as SelectedEventType;

    const result = await record_live_game_detail_event(
      "fixture-1",
      selected_event_type,
      70,
      "home",
      "Ada Stone",
      "",
      "Ben Flint",
      fixture_use_cases as FixtureUseCases,
    );

    expect(result).toEqual({ success: true, data: { id: "fixture-1" } });
    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        event_type: "substitution",
        minute: 70,
        team_side: "home",
        player_name: "Ada Stone",
        secondary_player_name: "Ben Flint",
        description: "Ada Stone ON for Ben Flint",
      }),
      NO_SCORE_AWARD,
    );
  });

  it("records added time as a match-level period-start event", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    } as Pick<FixtureUseCases, "record_game_event">;

    const record_live_game_extra_time_event_result =
      await record_live_game_extra_time_event(
        "fixture-1",
        90,
        5,
        "First Half",
        fixture_use_cases as FixtureUseCases,
      );
    expect(record_live_game_extra_time_event_result.success).toBe(true);

    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        event_type: "period_start",
        minute: 90,
        team_side: "match",
        player_name: "",
        description: "5 min added time - First Half",
      }),
      NO_SCORE_AWARD,
    );
  });

  it("records the lineup player ids chosen for the event", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    } as Pick<FixtureUseCases, "record_game_event">;

    const result = await record_live_game_detail_timed_event({
      fixture_id: "fixture-1",
      selected_event_type: {
        id: "substitution",
        label: "Sub",
        score_award: NO_SCORE_AWARD,
      } as SelectedEventType,
      minute: 60,
      stoppage_time_minute: 0,
      selected_team_side: "home",
      event_player_name: "Ada Stone",
      event_player_id: "player-on",
      event_description: "",
      secondary_player_name: "Ben Flint",
      secondary_player_id: "player-off",
      fixture_use_cases: fixture_use_cases as FixtureUseCases,
    });

    expect(result.success).toBe(true);
    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        player_id: "player-on",
        secondary_player_id: "player-off",
      }),
      NO_SCORE_AWARD,
    );
  });

  it("leaves player ids off events recorded without a chosen player", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    } as Pick<FixtureUseCases, "record_game_event">;

    const result = await record_live_game_detail_event(
      "fixture-1",
      {
        id: "corner",
        label: "Corner",
        score_award: NO_SCORE_AWARD,
      } as SelectedEventType,
      12,
      "away",
      "",
      "",
      "",
      fixture_use_cases as FixtureUseCases,
    );

    expect(result.success).toBe(true);
    const recorded_event = vi.mocked(fixture_use_cases.record_game_event).mock
      .calls[0][1];
    expect("player_id" in recorded_event).toBe(false);
    expect("secondary_player_id" in recorded_event).toBe(false);
  });
});
