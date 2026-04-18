import { describe, expect, it, vi } from "vitest";

import {
  record_live_game_detail_event,
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
    );
  });

  it("records added time as a match-level period-start event", async () => {
    const fixture_use_cases = {
      record_game_event: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: "fixture-1" } }),
    } as Pick<FixtureUseCases, "record_game_event">;

    await record_live_game_extra_time_event(
      "fixture-1",
      90,
      5,
      "First Half",
      fixture_use_cases as FixtureUseCases,
    );

    expect(fixture_use_cases.record_game_event).toHaveBeenCalledWith(
      "fixture-1",
      expect.objectContaining({
        event_type: "period_start",
        minute: 90,
        team_side: "match",
        player_name: "",
        description: "5 min added time - First Half",
      }),
    );
  });
});
