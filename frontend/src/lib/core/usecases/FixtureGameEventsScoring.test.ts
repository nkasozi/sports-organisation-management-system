import { describe, expect, it, vi } from "vitest";

import { create_score_award_resolver } from "../entities/SportEventCatalog";
import { create_fixture_game_events } from "./FixtureGameEventsUseCases";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: vi.fn() },
}));

const FIXTURE = {
  id: "fx1",
  status: "in_progress",
  home_team_score: 1,
  away_team_score: 2,
  game_events: [],
  current_period: "second_half",
};

function create_repository(): {
  find_by_id: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
} {
  return {
    find_by_id: vi.fn().mockResolvedValue({ success: true, data: FIXTURE }),
    update: vi.fn((id: string, updates: object) =>
      Promise.resolve({ success: true, data: { ...FIXTURE, ...updates, id } }),
    ),
  };
}

describe("recording a scoring event", () => {
  it("adds the points the sport awards for the event", async () => {
    const repository = {
      find_by_id: vi.fn().mockResolvedValue({ success: true, data: FIXTURE }),
      update: vi.fn((id: string, updates: object) =>
        Promise.resolve({
          success: true,
          data: { ...FIXTURE, ...updates, id },
        }),
      ),
    };
    const event = {
      event_type: "field_goal_3pt",
      team_side: "away",
      minute: 5,
    };

    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event(
      "fx1",
      event as never,
      create_score_award_resolver([
        { event_type: "field_goal_3pt", points_awarded: 3 },
      ])("field_goal_3pt"),
    );

    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      "fx1",
      expect.objectContaining({ away_team_score: 5 }),
    );
  });

  it("stores the awarded points and the current period on the event", async () => {
    const repository = create_repository();
    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event(
      "fx1",
      { id: "e1", event_type: "goal", team_side: "home", minute: 50 } as never,
      create_score_award_resolver([{ event_type: "goal", points_awarded: 2 }])(
        "goal",
      ),
    );

    expect(result.success).toBe(true);
    expect(repository.update.mock.calls[0][1].game_events).toEqual([
      expect.objectContaining({
        id: "e1",
        points_awarded: 2,
        period_id: "second_half",
      }),
    ]);
  });

  it("stores zero points for events that do not score", async () => {
    const repository = create_repository();
    const result = await create_fixture_game_events(
      repository as never,
    ).record_game_event(
      "fx1",
      { id: "e2", event_type: "foul", team_side: "home", minute: 51 } as never,
      { kind: "none" },
    );

    expect(result.success).toBe(true);
    expect(repository.update.mock.calls[0][1].game_events[0]).toMatchObject({
      points_awarded: 0,
    });
  });
});
